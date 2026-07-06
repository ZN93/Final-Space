package com.finalspace.backend.mission.report;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.alert.AlertSeverity;
import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.incident.Incident;
import com.finalspace.backend.incident.IncidentRepository;
import com.finalspace.backend.incident.IncidentSeverity;
import com.finalspace.backend.incident.IncidentStatus;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.simulation.SimulationRun;
import com.finalspace.backend.simulation.SimulationRunRepository;
import com.finalspace.backend.simulation.SimulationType;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MissionReportServiceImpl implements MissionReportService {

    private static final int LATEST_ITEMS_LIMIT = 5;

    private final MissionRepository missionRepository;
    private final SatelliteRepository satelliteRepository;
    private final SimulationRunRepository simulationRunRepository;
    private final AlertRepository alertRepository;
    private final IncidentRepository incidentRepository;

    @Override
    public byte[] generateMissionReportPdf(Long missionId, String generatedBy) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission introuvable"));

        List<Satellite> satellites = satelliteRepository.findByMissionId(missionId);
        List<SimulationRun> simulations = simulationRunRepository.findByMissionIdOrderByCreatedAtDesc(missionId);
        List<Alert> alerts = alertRepository.findByMissionIdOrderByCreatedAtDesc(missionId);
        List<Incident> incidents = incidentRepository.findByMissionIdOrderByCreatedAtDesc(missionId);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
            PdfWriter.getInstance(document, outputStream);

            document.open();

            addTitle(document, "Final Space - Rapport de mission");
            addReportMetadata(document, mission, generatedBy);

            addMissionInformationSection(document, mission);
            addKpiSection(document, satellites, simulations, alerts, incidents);
            addSatellitesSection(document, satellites);
            addSimulationSummarySection(document, simulations);
            addLatestSimulationsSection(document, simulations);
            addAlertSummarySection(document, alerts);
            addLatestAlertsSection(document, alerts);
            addIncidentSummarySection(document, incidents);
            addLatestIncidentsSection(document, incidents);
            addConclusionSection(document, mission, satellites, alerts, incidents);

            document.close();

            return outputStream.toByteArray();
        } catch (DocumentException exception) {
            throw new IllegalStateException("Impossible de générer le rapport PDF de mission", exception);
        } catch (Exception exception) {
            throw new IllegalStateException("Erreur inattendue pendant la génération du rapport PDF de mission", exception);
        }
    }

    @Override
    public String buildReportFilename(Long missionId) {
        return "mission-report-" + missionId + ".pdf";
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
            Mission mission,
            String generatedBy
    ) throws DocumentException {
        PdfPTable table = createTable(3, new float[]{30, 45, 25});
        addTableHeader(table, "Champ", "Valeur", "Commentaire");

        addTableRow(table, "Date de génération", LocalDateTime.now(), "Rapport généré à la demande");
        addTableRow(table, "Généré par", generatedBy, "Utilisateur authentifié");
        addTableRow(table, "Mission ID", mission.getId(), "Identifiant interne");

        document.add(table);
    }

    private void addMissionInformationSection(
            Document document,
            Mission mission
    ) throws DocumentException {
        addSectionTitle(document, "1. Informations générales de la mission");

        PdfPTable table = createTable(3, new float[]{30, 50, 20});
        addTableHeader(table, "Champ", "Valeur", "Unité");

        addTableRow(table, "Nom", mission.getName(), "");
        addTableRow(table, "Description", mission.getDescription(), "");
        addTableRow(table, "Statut", mission.getStatus(), "");
        addTableRow(table, "Date de création", mission.getCreatedAt(), "");
        addTableRow(table, "Date de clôture", mission.getClosedAt(), "");

        document.add(table);
    }

    private void addKpiSection(
            Document document,
            List<Satellite> satellites,
            List<SimulationRun> simulations,
            List<Alert> alerts,
            List<Incident> incidents
    ) throws DocumentException {
        addSectionTitle(document, "2. KPI globaux");

        long activeSatellites = countSatellitesByStatus(satellites, SatelliteStatus.ACTIF);
        long inactiveSatellites = countSatellitesByStatus(satellites, SatelliteStatus.INACTIF);

        long orbitSimulations = countSimulationsByType(simulations, SimulationType.ORBIT);
        long hohmannSimulations = countSimulationsByType(simulations, SimulationType.HOHMANN);

        long activeAlerts = countAlertsByStatus(alerts, AlertStatus.ACTIVE);
        long acknowledgedAlerts = countAlertsByStatus(alerts, AlertStatus.ACQUITTEE);

        long openedIncidents = countIncidentsByStatus(incidents, IncidentStatus.OUVERT);
        long inProgressIncidents = countIncidentsByStatus(incidents, IncidentStatus.EN_COURS);
        long closedIncidents = countIncidentsByStatus(incidents, IncidentStatus.CLOTURE);

        PdfPTable table = createTable(3, new float[]{30, 50, 20});
        addTableHeader(table, "Domaine", "Indicateur", "Valeur");

        addTableRow(table, "Satellites", "Total satellites", satellites.size());
        addTableRow(table, "Satellites", "Satellites actifs", activeSatellites);
        addTableRow(table, "Satellites", "Satellites inactifs", inactiveSatellites);

        addTableRow(table, "Simulations", "Total simulations", simulations.size());
        addTableRow(table, "Simulations", "Simulations orbitales", orbitSimulations);
        addTableRow(table, "Simulations", "Transferts de Hohmann", hohmannSimulations);

        addTableRow(table, "Alertes", "Total alertes", alerts.size());
        addTableRow(table, "Alertes", "Alertes actives", activeAlerts);
        addTableRow(table, "Alertes", "Alertes acquittées", acknowledgedAlerts);

        addTableRow(table, "Incidents", "Total incidents", incidents.size());
        addTableRow(table, "Incidents", "Incidents ouverts", openedIncidents);
        addTableRow(table, "Incidents", "Incidents en cours", inProgressIncidents);
        addTableRow(table, "Incidents", "Incidents clôturés", closedIncidents);

        document.add(table);
    }

    private void addSatellitesSection(
            Document document,
            List<Satellite> satellites
    ) throws DocumentException {
        addSectionTitle(document, "3. Satellites associés");

        if (satellites.isEmpty()) {
            addEmptyParagraph(document, "Aucun satellite associé à cette mission.");
            return;
        }

        PdfPTable table = createTable(7, new float[]{8, 20, 12, 12, 14, 14, 14});
        addTableHeader(table, "ID", "Nom", "Statut", "Masse kg", "Altitude km", "Inclinaison", "Excentricité");

        satellites.forEach(satellite -> addTableRow(
                table,
                satellite.getId(),
                satellite.getName(),
                satellite.getStatus(),
                satellite.getMassKg(),
                satellite.getAltitudeKm(),
                satellite.getInclinationDeg(),
                satellite.getEccentricity()
        ));

        document.add(table);
    }

    private void addSimulationSummarySection(
            Document document,
            List<SimulationRun> simulations
    ) throws DocumentException {
        addSectionTitle(document, "4. Synthèse des simulations");

        long orbitCount = countSimulationsByType(simulations, SimulationType.ORBIT);
        long hohmannCount = countSimulationsByType(simulations, SimulationType.HOHMANN);

        PdfPTable table = createTable(3, new float[]{35, 35, 30});
        addTableHeader(table, "Indicateur", "Valeur", "Commentaire");

        addTableRow(table, "Nombre total", simulations.size(), "Toutes simulations confondues");
        addTableRow(table, "Simulations ORBIT", orbitCount, "Calcul orbital");
        addTableRow(table, "Simulations HOHMANN", hohmannCount, "Transfert orbital");

        document.add(table);
    }

    private void addLatestSimulationsSection(
            Document document,
            List<SimulationRun> simulations
    ) throws DocumentException {
        addSectionTitle(document, "5. Dernières simulations");

        if (simulations.isEmpty()) {
            addEmptyParagraph(document, "Aucune simulation enregistrée pour cette mission.");
            return;
        }

        PdfPTable table = createTable(7, new float[]{8, 14, 14, 18, 18, 18, 30});
        addTableHeader(table, "ID", "Type", "Statut", "Satellite", "Créée le", "Auteur", "Résultat principal");

        simulations.stream()
                .limit(LATEST_ITEMS_LIMIT)
                .forEach(simulation -> addTableRow(
                        table,
                        simulation.getId(),
                        simulation.getType(),
                        simulation.getStatus(),
                        simulation.getSatellite().getName(),
                        simulation.getCreatedAt(),
                        simulation.getCreatedBy(),
                        buildSimulationResultSummary(simulation)
                ));

        document.add(table);
    }

    private void addAlertSummarySection(
            Document document,
            List<Alert> alerts
    ) throws DocumentException {
        addSectionTitle(document, "6. Synthèse des alertes");

        PdfPTable table = createTable(3, new float[]{35, 35, 30});
        addTableHeader(table, "Indicateur", "Valeur", "Commentaire");

        addTableRow(table, "Nombre total", alerts.size(), "Toutes alertes confondues");
        addTableRow(table, "Alertes actives", countAlertsByStatus(alerts, AlertStatus.ACTIVE), "À traiter");
        addTableRow(table, "Alertes acquittées", countAlertsByStatus(alerts, AlertStatus.ACQUITTEE), "Déjà prises en compte");
        addTableRow(table, "Gravité faible", countAlertsBySeverity(alerts, AlertSeverity.FAIBLE), "");
        addTableRow(table, "Gravité moyenne", countAlertsBySeverity(alerts, AlertSeverity.MOYENNE), "");
        addTableRow(table, "Gravité élevée", countAlertsBySeverity(alerts, AlertSeverity.ELEVEE), "");

        document.add(table);
    }

    private void addLatestAlertsSection(
            Document document,
            List<Alert> alerts
    ) throws DocumentException {
        addSectionTitle(document, "7. Dernières alertes");

        if (alerts.isEmpty()) {
            addEmptyParagraph(document, "Aucune alerte enregistrée pour cette mission.");
            return;
        }

        PdfPTable table = createTable(8, new float[]{7, 18, 12, 12, 18, 14, 18, 35});
        addTableHeader(table, "ID", "Type", "Gravité", "Statut", "Satellite", "Métrique", "Créée le", "Message");

        alerts.stream()
                .limit(LATEST_ITEMS_LIMIT)
                .forEach(alert -> addTableRow(
                        table,
                        alert.getId(),
                        alert.getType(),
                        alert.getSeverity(),
                        alert.getStatus(),
                        alert.getSatellite() != null ? alert.getSatellite().getName() : "-",
                        alert.getMetric(),
                        alert.getCreatedAt(),
                        truncate(alert.getMessage(), 90)
                ));

        document.add(table);
    }

    private void addIncidentSummarySection(
            Document document,
            List<Incident> incidents
    ) throws DocumentException {
        addSectionTitle(document, "8. Synthèse des incidents");

        PdfPTable table = createTable(3, new float[]{35, 35, 30});
        addTableHeader(table, "Indicateur", "Valeur", "Commentaire");

        addTableRow(table, "Nombre total", incidents.size(), "Tous incidents confondus");
        addTableRow(table, "Incidents ouverts", countIncidentsByStatus(incidents, IncidentStatus.OUVERT), "À traiter");
        addTableRow(table, "Incidents en cours", countIncidentsByStatus(incidents, IncidentStatus.EN_COURS), "Traitement engagé");
        addTableRow(table, "Incidents clôturés", countIncidentsByStatus(incidents, IncidentStatus.CLOTURE), "Terminés");
        addTableRow(table, "Gravité faible", countIncidentsBySeverity(incidents, IncidentSeverity.FAIBLE), "");
        addTableRow(table, "Gravité moyenne", countIncidentsBySeverity(incidents, IncidentSeverity.MOYENNE), "");
        addTableRow(table, "Gravité élevée", countIncidentsBySeverity(incidents, IncidentSeverity.ELEVEE), "");

        document.add(table);
    }

    private void addLatestIncidentsSection(
            Document document,
            List<Incident> incidents
    ) throws DocumentException {
        addSectionTitle(document, "9. Derniers incidents");

        if (incidents.isEmpty()) {
            addEmptyParagraph(document, "Aucun incident enregistré pour cette mission.");
            return;
        }

        PdfPTable table = createTable(7, new float[]{7, 30, 12, 12, 18, 18, 18});
        addTableHeader(table, "ID", "Titre", "Gravité", "Statut", "Satellite", "Créé le", "Clôturé le");

        incidents.stream()
                .limit(LATEST_ITEMS_LIMIT)
                .forEach(incident -> addTableRow(
                        table,
                        incident.getId(),
                        truncate(incident.getTitle(), 80),
                        incident.getSeverity(),
                        incident.getStatus(),
                        incident.getSatellite() != null ? incident.getSatellite().getName() : "-",
                        incident.getCreatedAt(),
                        incident.getClosedAt()
                ));

        document.add(table);
    }

    private void addConclusionSection(
            Document document,
            Mission mission,
            List<Satellite> satellites,
            List<Alert> alerts,
            List<Incident> incidents
    ) throws DocumentException {
        addSectionTitle(document, "10. Conclusion automatique");

        long activeAlerts = countAlertsByStatus(alerts, AlertStatus.ACTIVE);
        long openIncidents = countIncidentsByStatus(incidents, IncidentStatus.OUVERT);
        long inProgressIncidents = countIncidentsByStatus(incidents, IncidentStatus.EN_COURS);
        long activeSatellites = countSatellitesByStatus(satellites, SatelliteStatus.ACTIF);

        String conclusion = "La mission "
                + mission.getName()
                + " est actuellement au statut "
                + mission.getStatus()
                + ". Elle comporte "
                + satellites.size()
                + " satellite(s), dont "
                + activeSatellites
                + " actif(s). Le rapport recense "
                + activeAlerts
                + " alerte(s) active(s), "
                + openIncidents
                + " incident(s) ouvert(s) et "
                + inProgressIncidents
                + " incident(s) en cours. Les données présentées correspondent à l'état courant de la mission au moment de la génération du rapport.";

        Paragraph paragraph = new Paragraph(
                conclusion,
                FontFactory.getFont(FontFactory.HELVETICA, 10)
        );
        paragraph.setSpacingAfter(12);
        document.add(paragraph);

        Paragraph footer = new Paragraph(
                "Rapport généré automatiquement par Final Space. La génération du rapport ne modifie pas les données en base.",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9)
        );
        document.add(footer);
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

    private String buildSimulationResultSummary(SimulationRun simulation) {
        if (simulation.getType() == SimulationType.ORBIT) {
            return "Période "
                    + format(simulation.getOrbitalPeriodMinutes())
                    + " min / Vitesse "
                    + format(simulation.getAverageVelocityKmS())
                    + " km/s / "
                    + format(simulation.getOrbitShape());
        }

        if (simulation.getType() == SimulationType.HOHMANN) {
            return "Delta V total "
                    + format(simulation.getDeltaVTotalMS())
                    + " m/s / Durée "
                    + format(simulation.getTransferTimeMinutes())
                    + " min";
        }

        return "-";
    }

    private long countSatellitesByStatus(List<Satellite> satellites, SatelliteStatus status) {
        return satellites.stream()
                .filter(satellite -> satellite.getStatus() == status)
                .count();
    }

    private long countSimulationsByType(List<SimulationRun> simulations, SimulationType type) {
        return simulations.stream()
                .filter(simulation -> simulation.getType() == type)
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

    private long countIncidentsByStatus(List<Incident> incidents, IncidentStatus status) {
        return incidents.stream()
                .filter(incident -> incident.getStatus() == status)
                .count();
    }

    private long countIncidentsBySeverity(List<Incident> incidents, IncidentSeverity severity) {
        return incidents.stream()
                .filter(incident -> incident.getSeverity() == severity)
                .count();
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

    private String format(Object value) {
        return value == null ? "-" : value.toString();
    }
}