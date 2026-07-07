package com.finalspace.backend.telemetry.report;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.alert.AlertSeverity;
import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.telemetry.TelemetryPoint;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomaly;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalySeverity;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalyType;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TelemetryReportServiceImpl implements TelemetryReportService {

    private static final int MAX_EXPORT_POINTS = 10_000;
    private static final int LATEST_ITEMS_LIMIT = 20;

    private final SatelliteRepository satelliteRepository;
    private final AlertRepository alertRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public byte[] generateTelemetryReportCsv(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to
    ) {
        ReportData data = loadReportData(satelliteId, metrics, from, to);
        Map<TelemetryKey, List<TelemetryAnomaly>> anomaliesByPoint = groupAnomaliesByPoint(data.anomalies());

        StringBuilder csv = new StringBuilder();

        csv.append("missionId;")
                .append("missionName;")
                .append("satelliteId;")
                .append("satelliteName;")
                .append("timestamp;")
                .append("metric;")
                .append("value;")
                .append("anomalyFlag;")
                .append("anomalyType;")
                .append("anomalySeverity;")
                .append("anomalyMessage")
                .append("\r\n");

        for (TelemetryPoint point : data.points()) {
            List<TelemetryAnomaly> pointAnomalies = anomaliesByPoint.getOrDefault(
                    new TelemetryKey(point.getMetric(), point.getTimestamp()),
                    List.of()
            );

            csv.append(csvValue(data.mission().getId())).append(';')
                    .append(csvValue(data.mission().getName())).append(';')
                    .append(csvValue(data.satellite().getId())).append(';')
                    .append(csvValue(data.satellite().getName())).append(';')
                    .append(csvValue(point.getTimestamp())).append(';')
                    .append(csvValue(point.getMetric())).append(';')
                    .append(csvValue(point.getValue())).append(';')
                    .append(csvValue(!pointAnomalies.isEmpty())).append(';')
                    .append(csvValue(joinAnomalyTypes(pointAnomalies))).append(';')
                    .append(csvValue(joinAnomalySeverities(pointAnomalies))).append(';')
                    .append(csvValue(joinAnomalyMessages(pointAnomalies)))
                    .append("\r\n");
        }

        return ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public byte[] generateTelemetryReportPdf(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to,
            String generatedBy
    ) {
        ReportData data = loadReportData(satelliteId, metrics, from, to);
        List<MetricStats> metricStats = buildMetricStats(data.points());

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
            PdfWriter.getInstance(document, outputStream);

            document.open();

            addTitle(document, "Final Space - Rapport de télémétrie");
            addReportMetadata(document, data, generatedBy);
            addMissionSatelliteSection(document, data);
            addPeriodSection(document, data);
            addMetricSummarySection(document, metricStats);
            addAnomalySummarySection(document, data.anomalies());
            addLatestAnomaliesSection(document, data.anomalies());
            addAlertSummarySection(document, data.alerts());
            addLatestTelemetryPointsSection(document, data.points());
            addConclusionSection(document, data);

            document.close();

            return outputStream.toByteArray();
        } catch (DocumentException exception) {
            throw new IllegalStateException("Impossible de générer le rapport PDF de télémétrie", exception);
        } catch (Exception exception) {
            throw new IllegalStateException("Erreur inattendue pendant la génération du rapport PDF de télémétrie", exception);
        }
    }

    @Override
    public String buildCsvFilename(Long satelliteId) {
        return "telemetry-report-" + satelliteId + ".csv";
    }

    @Override
    public String buildPdfFilename(Long satelliteId) {
        return "telemetry-report-" + satelliteId + ".pdf";
    }

    private ReportData loadReportData(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to
    ) {
        Satellite satellite = satelliteRepository.findByIdWithMission(satelliteId)
                .orElseThrow(() -> new ResourceNotFoundException("Satellite introuvable"));

        Mission mission = satellite.getMission();

        List<String> normalizedMetrics = normalizeMetrics(metrics);
        validatePeriod(from, to);

        List<TelemetryPoint> points = findTelemetryPoints(
                satelliteId,
                normalizedMetrics,
                from,
                to
        );

        if (points.size() > MAX_EXPORT_POINTS) {
            throw new BusinessException("L'export de télémétrie est limité à " + MAX_EXPORT_POINTS + " points");
        }

        List<TelemetryAnomaly> anomalies = findTelemetryAnomalies(
                satelliteId,
                normalizedMetrics,
                from,
                to
        );

        List<Alert> alerts = findTelemetryAlerts(
                mission.getId(),
                satelliteId,
                normalizedMetrics,
                from,
                to
        );

        return new ReportData(
                mission,
                satellite,
                normalizedMetrics,
                from,
                to,
                points,
                anomalies,
                alerts
        );
    }

    private List<TelemetryPoint> findTelemetryPoints(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to
    ) {
        Query query = new Query();

        query.addCriteria(
                Criteria.where("satelliteId").is(satelliteId)
                        .and("metric").in(metrics)
        );

        addTimestampCriteria(query, from, to);

        query.with(Sort.by(Sort.Direction.ASC, "timestamp"));

        return mongoTemplate.find(query, TelemetryPoint.class);
    }

    private List<TelemetryAnomaly> findTelemetryAnomalies(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to
    ) {
        Query query = new Query();

        query.addCriteria(
                Criteria.where("satelliteId").is(satelliteId)
                        .and("metric").in(metrics)
        );

        addTimestampCriteria(query, from, to);

        query.with(Sort.by(Sort.Direction.DESC, "timestamp"));

        return mongoTemplate.find(query, TelemetryAnomaly.class);
    }

    private List<Alert> findTelemetryAlerts(
            Long missionId,
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to
    ) {
        return alertRepository.findByMissionIdOrderByCreatedAtDesc(missionId)
                .stream()
                .filter(alert -> alert.getSatellite() != null)
                .filter(alert -> Objects.equals(alert.getSatellite().getId(), satelliteId))
                .filter(alert -> alert.getMetric() != null && metrics.contains(alert.getMetric()))
                .filter(alert -> isAlertInPeriod(alert, from, to))
                .toList();
    }

    private boolean isAlertInPeriod(Alert alert, Instant from, Instant to) {
        Instant timestamp = alert.getTelemetryTimestamp();

        if (timestamp == null) {
            return true;
        }

        if (from != null && timestamp.isBefore(from)) {
            return false;
        }

        return to == null || !timestamp.isAfter(to);
    }

    private void addTimestampCriteria(Query query, Instant from, Instant to) {
        if (from == null && to == null) {
            return;
        }

        Criteria timestampCriteria = Criteria.where("timestamp");

        if (from != null) {
            timestampCriteria = timestampCriteria.gte(from);
        }

        if (to != null) {
            timestampCriteria = timestampCriteria.lte(to);
        }

        query.addCriteria(timestampCriteria);
    }

    private List<String> normalizeMetrics(List<String> metrics) {
        if (metrics == null || metrics.isEmpty()) {
            throw new BusinessException("Au moins une métrique est obligatoire");
        }

        List<String> normalizedMetrics = metrics.stream()
                .flatMap(metric -> Arrays.stream(metric.split(",")))
                .map(String::trim)
                .filter(metric -> !metric.isBlank())
                .distinct()
                .toList();

        if (normalizedMetrics.isEmpty()) {
            throw new BusinessException("Au moins une métrique est obligatoire");
        }

        return normalizedMetrics;
    }

    private void validatePeriod(Instant from, Instant to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BusinessException("La date de début doit être antérieure à la date de fin");
        }
    }

    private List<MetricStats> buildMetricStats(List<TelemetryPoint> points) {
        Map<String, List<TelemetryPoint>> groupedByMetric = points.stream()
                .collect(Collectors.groupingBy(TelemetryPoint::getMetric));

        return groupedByMetric.entrySet()
                .stream()
                .map(entry -> {
                    String metric = entry.getKey();
                    List<Double> values = entry.getValue()
                            .stream()
                            .map(TelemetryPoint::getValue)
                            .filter(Objects::nonNull)
                            .toList();

                    if (values.isEmpty()) {
                        return new MetricStats(metric, entry.getValue().size(), null, null, null);
                    }

                    double min = values.stream().mapToDouble(Double::doubleValue).min().orElse(0);
                    double max = values.stream().mapToDouble(Double::doubleValue).max().orElse(0);
                    double average = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);

                    return new MetricStats(metric, entry.getValue().size(), min, max, average);
                })
                .sorted(Comparator.comparing(MetricStats::metric))
                .toList();
    }

    private Map<TelemetryKey, List<TelemetryAnomaly>> groupAnomaliesByPoint(List<TelemetryAnomaly> anomalies) {
        return anomalies.stream()
                .collect(Collectors.groupingBy(anomaly -> new TelemetryKey(
                        anomaly.getMetric(),
                        anomaly.getTimestamp()
                )));
    }

    private String joinAnomalyTypes(List<TelemetryAnomaly> anomalies) {
        return anomalies.stream()
                .map(anomaly -> anomaly.getType().name())
                .distinct()
                .collect(Collectors.joining(" | "));
    }

    private String joinAnomalySeverities(List<TelemetryAnomaly> anomalies) {
        return anomalies.stream()
                .map(anomaly -> anomaly.getSeverity().name())
                .distinct()
                .collect(Collectors.joining(" | "));
    }

    private String joinAnomalyMessages(List<TelemetryAnomaly> anomalies) {
        return anomalies.stream()
                .map(TelemetryAnomaly::getMessage)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.joining(" | "));
    }

    private void addTitle(Document document, String title) throws DocumentException {
        Paragraph paragraph = new Paragraph(
                title,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20)
        );
        paragraph.setAlignment(Element.ALIGN_CENTER);
        paragraph.setSpacingAfter(18);
        document.add(paragraph);
    }

    private void addReportMetadata(
            Document document,
            ReportData data,
            String generatedBy
    ) throws DocumentException {
        PdfPTable table = createTable(3, new float[]{30, 45, 25});
        addTableHeader(table, "Champ", "Valeur", "Commentaire");

        addTableRow(table, "Date de génération", LocalDateTime.now(), "Rapport généré à la demande");
        addTableRow(table, "Généré par", generatedBy, "Utilisateur authentifié");
        addTableRow(table, "Satellite ID", data.satellite().getId(), "Identifiant interne");

        document.add(table);
    }

    private void addMissionSatelliteSection(
            Document document,
            ReportData data
    ) throws DocumentException {
        addSectionTitle(document, "1. Informations générales");

        PdfPTable table = createTable(3, new float[]{30, 50, 20});
        addTableHeader(table, "Champ", "Valeur", "Unité");

        addTableRow(table, "Mission", data.mission().getName() + " (#" + data.mission().getId() + ")", "");
        addTableRow(table, "Statut mission", data.mission().getStatus(), "");
        addTableRow(table, "Satellite", data.satellite().getName() + " (#" + data.satellite().getId() + ")", "");
        addTableRow(table, "Statut satellite", data.satellite().getStatus(), "");
        addTableRow(table, "Masse", data.satellite().getMassKg(), "kg");
        addTableRow(table, "Altitude", data.satellite().getAltitudeKm(), "km");
        addTableRow(table, "Inclinaison", data.satellite().getInclinationDeg(), "deg");
        addTableRow(table, "Excentricité", data.satellite().getEccentricity(), "");

        document.add(table);
    }

    private void addPeriodSection(
            Document document,
            ReportData data
    ) throws DocumentException {
        addSectionTitle(document, "2. Périmètre du rapport");

        PdfPTable table = createTable(3, new float[]{30, 50, 20});
        addTableHeader(table, "Champ", "Valeur", "Commentaire");

        addTableRow(table, "Métriques analysées", String.join(", ", data.metrics()), "");
        addTableRow(table, "Début", data.from(), "Filtre optionnel");
        addTableRow(table, "Fin", data.to(), "Filtre optionnel");
        addTableRow(table, "Points exportés", data.points().size(), "Limite " + MAX_EXPORT_POINTS);
        addTableRow(table, "Anomalies associées", data.anomalies().size(), "");
        addTableRow(table, "Alertes associées", data.alerts().size(), "");

        document.add(table);
    }

    private void addMetricSummarySection(
            Document document,
            List<MetricStats> stats
    ) throws DocumentException {
        addSectionTitle(document, "3. Synthèse des métriques");

        if (stats.isEmpty()) {
            addEmptyParagraph(document, "Aucun point de télémétrie trouvé pour les filtres sélectionnés.");
            return;
        }

        PdfPTable table = createTable(5, new float[]{25, 15, 20, 20, 20});
        addTableHeader(table, "Métrique", "Points", "Minimum", "Maximum", "Moyenne");

        stats.forEach(stat -> addTableRow(
                table,
                stat.metric(),
                stat.count(),
                stat.min(),
                stat.max(),
                stat.average()
        ));

        document.add(table);
    }

    private void addAnomalySummarySection(
            Document document,
            List<TelemetryAnomaly> anomalies
    ) throws DocumentException {
        addSectionTitle(document, "4. Synthèse des anomalies");

        PdfPTable table = createTable(3, new float[]{35, 35, 30});
        addTableHeader(table, "Indicateur", "Valeur", "Commentaire");

        addTableRow(table, "Nombre total", anomalies.size(), "");
        addTableRow(table, "THRESHOLD", countAnomaliesByType(anomalies, TelemetryAnomalyType.THRESHOLD), "Seuil dépassé");
        addTableRow(table, "VARIATION", countAnomaliesByType(anomalies, TelemetryAnomalyType.VARIATION), "Variation brusque");
        addTableRow(table, "MISSING", countAnomaliesByType(anomalies, TelemetryAnomalyType.MISSING), "Données manquantes");
        addTableRow(table, "Gravité faible", countAnomaliesBySeverity(anomalies, TelemetryAnomalySeverity.FAIBLE), "");
        addTableRow(table, "Gravité moyenne", countAnomaliesBySeverity(anomalies, TelemetryAnomalySeverity.MOYENNE), "");
        addTableRow(table, "Gravité élevée", countAnomaliesBySeverity(anomalies, TelemetryAnomalySeverity.ELEVEE), "");

        document.add(table);
    }

    private void addLatestAnomaliesSection(
            Document document,
            List<TelemetryAnomaly> anomalies
    ) throws DocumentException {
        addSectionTitle(document, "5. Dernières anomalies");

        if (anomalies.isEmpty()) {
            addEmptyParagraph(document, "Aucune anomalie associée aux filtres sélectionnés.");
            return;
        }

        PdfPTable table = createTable(7, new float[]{18, 18, 16, 16, 16, 22, 40});
        addTableHeader(table, "Date", "Métrique", "Type", "Gravité", "Valeur", "Règle", "Message");

        anomalies.stream()
                .limit(LATEST_ITEMS_LIMIT)
                .forEach(anomaly -> addTableRow(
                        table,
                        anomaly.getTimestamp(),
                        anomaly.getMetric(),
                        anomaly.getType(),
                        anomaly.getSeverity(),
                        anomaly.getValue(),
                        anomaly.getRuleName(),
                        truncate(anomaly.getMessage(), 100)
                ));

        document.add(table);
    }

    private void addAlertSummarySection(
            Document document,
            List<Alert> alerts
    ) throws DocumentException {
        addSectionTitle(document, "6. Alertes associées");

        PdfPTable table = createTable(3, new float[]{35, 35, 30});
        addTableHeader(table, "Indicateur", "Valeur", "Commentaire");

        addTableRow(table, "Nombre total", alerts.size(), "");
        addTableRow(table, "Alertes actives", countAlertsByStatus(alerts, AlertStatus.ACTIVE), "À traiter");
        addTableRow(table, "Alertes acquittées", countAlertsByStatus(alerts, AlertStatus.ACQUITTEE), "Déjà prises en compte");
        addTableRow(table, "Gravité faible", countAlertsBySeverity(alerts, AlertSeverity.FAIBLE), "");
        addTableRow(table, "Gravité moyenne", countAlertsBySeverity(alerts, AlertSeverity.MOYENNE), "");
        addTableRow(table, "Gravité élevée", countAlertsBySeverity(alerts, AlertSeverity.ELEVEE), "");

        document.add(table);
    }

    private void addLatestTelemetryPointsSection(
            Document document,
            List<TelemetryPoint> points
    ) throws DocumentException {
        addSectionTitle(document, "7. Derniers points de télémétrie");

        if (points.isEmpty()) {
            addEmptyParagraph(document, "Aucun point de télémétrie trouvé pour les filtres sélectionnés.");
            return;
        }

        PdfPTable table = createTable(4, new float[]{28, 24, 24, 24});
        addTableHeader(table, "Timestamp", "Métrique", "Valeur", "Import");

        points.stream()
                .sorted(Comparator.comparing(TelemetryPoint::getTimestamp).reversed())
                .limit(LATEST_ITEMS_LIMIT)
                .forEach(point -> addTableRow(
                        table,
                        point.getTimestamp(),
                        point.getMetric(),
                        point.getValue(),
                        point.getSourceImportId()
                ));

        document.add(table);
    }

    private void addConclusionSection(
            Document document,
            ReportData data
    ) throws DocumentException {
        addSectionTitle(document, "8. Conclusion automatique");

        long highAnomalies = countAnomaliesBySeverity(data.anomalies(), TelemetryAnomalySeverity.ELEVEE);
        long activeAlerts = countAlertsByStatus(data.alerts(), AlertStatus.ACTIVE);

        String conclusion = "Le rapport de télémétrie du satellite "
                + data.satellite().getName()
                + " couvre "
                + data.points().size()
                + " point(s) de mesure sur "
                + data.metrics().size()
                + " métrique(s). "
                + data.anomalies().size()
                + " anomalie(s) sont associées aux filtres sélectionnés, dont "
                + highAnomalies
                + " de gravité élevée. "
                + activeAlerts
                + " alerte(s) active(s) sont liées aux données analysées. "
                + "Les données présentées correspondent aux données existantes en base au moment de la génération du rapport.";

        Paragraph paragraph = new Paragraph(
                conclusion,
                FontFactory.getFont(FontFactory.HELVETICA, 10)
        );
        paragraph.setSpacingAfter(12);
        document.add(paragraph);

        Paragraph footer = new Paragraph(
                "Rapport généré automatiquement par Final Space. La génération du rapport n'altère pas les données de télémétrie.",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9)
        );
        document.add(footer);
    }

    private long countAnomaliesByType(List<TelemetryAnomaly> anomalies, TelemetryAnomalyType type) {
        return anomalies.stream()
                .filter(anomaly -> anomaly.getType() == type)
                .count();
    }

    private long countAnomaliesBySeverity(List<TelemetryAnomaly> anomalies, TelemetryAnomalySeverity severity) {
        return anomalies.stream()
                .filter(anomaly -> anomaly.getSeverity() == severity)
                .count();
    }

    private long countAlertsByStatus(List<Alert> alerts, AlertStatus status) {
        return alerts.stream()
                .filter(alert -> alert.getStatus() == status)
                .count();
    }

    private long countAlertsBySeverity(List<Alert> alerts, AlertSeverity severity) {
        return alerts.stream()
                .filter(alert -> alert.getSeverity() == severity)
                .count();
    }

    private PdfPTable createTable(int columns, float[] widths) throws DocumentException {
        PdfPTable table = new PdfPTable(columns);
        table.setWidthPercentage(100);
        table.setWidths(widths);
        table.setSpacingAfter(12);
        return table;
    }

    private void addSectionTitle(Document document, String title) throws DocumentException {
        Paragraph paragraph = new Paragraph(
                title,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)
        );
        paragraph.setSpacingBefore(12);
        paragraph.setSpacingAfter(8);
        document.add(paragraph);
    }

    private void addEmptyParagraph(Document document, String text) throws DocumentException {
        Paragraph paragraph = new Paragraph(
                text,
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10)
        );
        paragraph.setSpacingAfter(12);
        document.add(paragraph);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        for (String header : headers) {
            table.addCell(createHeaderCell(header));
        }
    }

    private void addTableRow(PdfPTable table, Object... values) {
        for (Object value : values) {
            table.addCell(createBodyCell(format(value)));
        }
    }

    private PdfPCell createHeaderCell(String value) {
        PdfPCell cell = new PdfPCell(new Phrase(
                value,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8)
        ));
        cell.setBackgroundColor(new Color(230, 230, 230));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setPadding(5);
        return cell;
    }

    private PdfPCell createBodyCell(String value) {
        PdfPCell cell = new PdfPCell(new Phrase(
                value,
                FontFactory.getFont(FontFactory.HELVETICA, 8)
        ));
        cell.setPadding(5);
        return cell;
    }

    private String csvValue(Object value) {
        if (value == null) {
            return "";
        }

        String text = value.toString();

        if (
                text.contains(";")
                        || text.contains("\"")
                        || text.contains("\n")
                        || text.contains("\r")
        ) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }

        return text;
    }

    private String format(Object value) {
        if (value == null) {
            return "-";
        }

        if (value instanceof Double doubleValue) {
            return String.format(Locale.US, "%.3f", doubleValue);
        }

        return value.toString();
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return "-";
        }

        if (value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, maxLength - 3) + "...";
    }

    private record ReportData(
            Mission mission,
            Satellite satellite,
            List<String> metrics,
            Instant from,
            Instant to,
            List<TelemetryPoint> points,
            List<TelemetryAnomaly> anomalies,
            List<Alert> alerts
    ) {
    }

    private record TelemetryKey(
            String metric,
            Instant timestamp
    ) {
    }

    private record MetricStats(
            String metric,
            long count,
            Double min,
            Double max,
            Double average
    ) {
    }
}