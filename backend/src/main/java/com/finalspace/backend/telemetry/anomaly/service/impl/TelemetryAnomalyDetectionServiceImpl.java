package com.finalspace.backend.telemetry.anomaly.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.telemetry.TelemetryPoint;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomaly;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalyRepository;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalySeverity;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalyType;
import com.finalspace.backend.telemetry.anomaly.dto.TelemetryAnomalyDetectionResponse;
import com.finalspace.backend.telemetry.anomaly.dto.TelemetryAnomalyQueryResponse;
import com.finalspace.backend.telemetry.anomaly.dto.TelemetryAnomalyResponse;
import com.finalspace.backend.telemetry.anomaly.service.TelemetryAnomalyDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TelemetryAnomalyDetectionServiceImpl implements TelemetryAnomalyDetectionService {

    private static final long MISSING_DATA_GAP_MINUTES = 10;

    private static final Map<String, MetricThresholdRule> THRESHOLD_RULES = Map.of(
            "temperature", new MetricThresholdRule(null, 60.0, 80.0, null),
            "battery", new MetricThresholdRule(40.0, null, null, 20.0),
            "speed", new MetricThresholdRule(null, 7800.0, 8000.0, null)
    );

    private static final Map<String, Double> VARIATION_LIMITS = Map.of(
            "temperature", 10.0,
            "battery", 15.0,
            "speed", 150.0
    );

    private final SatelliteRepository satelliteRepository;
    private final MongoTemplate mongoTemplate;
    private final TelemetryAnomalyRepository telemetryAnomalyRepository;

    @Override
    public TelemetryAnomalyDetectionResponse detectAnomalies(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to
    ) {
        validateSatelliteExists(satelliteId);
        validatePeriod(from, to);

        List<String> normalizedMetrics = normalizeMetrics(metrics);
        List<TelemetryPoint> points = findTelemetryPoints(satelliteId, normalizedMetrics, from, to);

        List<TelemetryAnomaly> detectedAnomalies = new ArrayList<>();

        for (String metric : normalizedMetrics) {
            List<TelemetryPoint> metricPoints = points.stream()
                    .filter(point -> metric.equals(point.getMetric()))
                    .toList();

            detectedAnomalies.addAll(detectThresholdAnomalies(metricPoints));
            detectedAnomalies.addAll(detectVariationAnomalies(metricPoints));
            detectedAnomalies.addAll(detectMissingDataAnomalies(metricPoints));
        }

        List<TelemetryAnomaly> savedAnomalies = saveWithoutDuplicates(detectedAnomalies);

        return new TelemetryAnomalyDetectionResponse(
                satelliteId,
                detectedAnomalies.size(),
                savedAnomalies.size(),
                savedAnomalies.stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @Override
    public TelemetryAnomalyQueryResponse getAnomalies(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to
    ) {
        validateSatelliteExists(satelliteId);
        validatePeriod(from, to);

        Query query = new Query();
        query.addCriteria(Criteria.where("satelliteId").is(satelliteId));

        List<String> normalizedMetrics = normalizeMetricsOrEmpty(metrics);

        if (!normalizedMetrics.isEmpty()) {
            query.addCriteria(Criteria.where("metric").in(normalizedMetrics));
        }

        if (from != null || to != null) {
            Criteria timestampCriteria = Criteria.where("timestamp");

            if (from != null) {
                timestampCriteria = timestampCriteria.gte(from);
            }

            if (to != null) {
                timestampCriteria = timestampCriteria.lte(to);
            }

            query.addCriteria(timestampCriteria);
        }

        query.with(Sort.by(Sort.Direction.DESC, "timestamp"));

        List<TelemetryAnomalyResponse> anomalies = mongoTemplate.find(query, TelemetryAnomaly.class)
                .stream()
                .map(this::toResponse)
                .toList();

        return new TelemetryAnomalyQueryResponse(
                satelliteId,
                anomalies.size(),
                anomalies
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

        if (from != null || to != null) {
            Criteria timestampCriteria = Criteria.where("timestamp");

            if (from != null) {
                timestampCriteria = timestampCriteria.gte(from);
            }

            if (to != null) {
                timestampCriteria = timestampCriteria.lte(to);
            }

            query.addCriteria(timestampCriteria);
        }

        query.with(Sort.by(Sort.Direction.ASC, "timestamp"));

        return mongoTemplate.find(query, TelemetryPoint.class);
    }

    private List<TelemetryAnomaly> detectThresholdAnomalies(List<TelemetryPoint> points) {
        List<TelemetryAnomaly> anomalies = new ArrayList<>();

        if (points.isEmpty()) {
            return anomalies;
        }

        String metric = points.get(0).getMetric();
        MetricThresholdRule rule = THRESHOLD_RULES.get(metric);

        if (rule == null) {
            return anomalies;
        }

        for (TelemetryPoint point : points) {
            if (rule.criticalMax() != null && point.getValue() > rule.criticalMax()) {
                anomalies.add(buildAnomaly(
                        point,
                        TelemetryAnomalyType.THRESHOLD,
                        TelemetryAnomalySeverity.ELEVEE,
                        "threshold_" + metric + "_critical_max",
                        rule.criticalMax(),
                        "Valeur supérieure au seuil critique"
                ));
                continue;
            }

            if (rule.warningMax() != null && point.getValue() > rule.warningMax()) {
                anomalies.add(buildAnomaly(
                        point,
                        TelemetryAnomalyType.THRESHOLD,
                        TelemetryAnomalySeverity.MOYENNE,
                        "threshold_" + metric + "_warning_max",
                        rule.warningMax(),
                        "Valeur supérieure au seuil d'alerte"
                ));
                continue;
            }

            if (rule.criticalMin() != null && point.getValue() < rule.criticalMin()) {
                anomalies.add(buildAnomaly(
                        point,
                        TelemetryAnomalyType.THRESHOLD,
                        TelemetryAnomalySeverity.ELEVEE,
                        "threshold_" + metric + "_critical_min",
                        rule.criticalMin(),
                        "Valeur inférieure au seuil critique"
                ));
                continue;
            }

            if (rule.warningMin() != null && point.getValue() < rule.warningMin()) {
                anomalies.add(buildAnomaly(
                        point,
                        TelemetryAnomalyType.THRESHOLD,
                        TelemetryAnomalySeverity.MOYENNE,
                        "threshold_" + metric + "_warning_min",
                        rule.warningMin(),
                        "Valeur inférieure au seuil d'alerte"
                ));
            }
        }

        return anomalies;
    }

    private List<TelemetryAnomaly> detectVariationAnomalies(List<TelemetryPoint> points) {
        List<TelemetryAnomaly> anomalies = new ArrayList<>();

        if (points.size() < 2) {
            return anomalies;
        }

        String metric = points.get(0).getMetric();
        Double maxDelta = VARIATION_LIMITS.get(metric);

        if (maxDelta == null) {
            return anomalies;
        }

        for (int index = 1; index < points.size(); index++) {
            TelemetryPoint previousPoint = points.get(index - 1);
            TelemetryPoint currentPoint = points.get(index);

            double delta = Math.abs(currentPoint.getValue() - previousPoint.getValue());

            if (delta > maxDelta) {
                anomalies.add(TelemetryAnomaly.builder()
                        .missionId(currentPoint.getMissionId())
                        .satelliteId(currentPoint.getSatelliteId())
                        .metric(currentPoint.getMetric())
                        .type(TelemetryAnomalyType.VARIATION)
                        .severity(TelemetryAnomalySeverity.MOYENNE)
                        .timestamp(currentPoint.getTimestamp())
                        .value(currentPoint.getValue())
                        .previousValue(previousPoint.getValue())
                        .previousTimestamp(previousPoint.getTimestamp())
                        .ruleName("variation_" + metric + "_max_delta")
                        .thresholdUsed(maxDelta)
                        .message("Variation brutale détectée entre deux points consécutifs")
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }

        return anomalies;
    }

    private List<TelemetryAnomaly> detectMissingDataAnomalies(List<TelemetryPoint> points) {
        List<TelemetryAnomaly> anomalies = new ArrayList<>();

        if (points.size() < 2) {
            return anomalies;
        }

        String metric = points.get(0).getMetric();

        for (int index = 1; index < points.size(); index++) {
            TelemetryPoint previousPoint = points.get(index - 1);
            TelemetryPoint currentPoint = points.get(index);

            long gapMinutes = Duration.between(
                    previousPoint.getTimestamp(),
                    currentPoint.getTimestamp()
            ).toMinutes();

            if (gapMinutes > MISSING_DATA_GAP_MINUTES) {
                anomalies.add(TelemetryAnomaly.builder()
                        .missionId(currentPoint.getMissionId())
                        .satelliteId(currentPoint.getSatelliteId())
                        .metric(currentPoint.getMetric())
                        .type(TelemetryAnomalyType.MISSING)
                        .severity(TelemetryAnomalySeverity.FAIBLE)
                        .timestamp(currentPoint.getTimestamp())
                        .value(currentPoint.getValue())
                        .previousValue(previousPoint.getValue())
                        .previousTimestamp(previousPoint.getTimestamp())
                        .ruleName("missing_" + metric + "_gap")
                        .thresholdUsed((double) MISSING_DATA_GAP_MINUTES)
                        .message("Absence de données détectée sur une période supérieure au seuil")
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        }

        return anomalies;
    }

    private TelemetryAnomaly buildAnomaly(
            TelemetryPoint point,
            TelemetryAnomalyType type,
            TelemetryAnomalySeverity severity,
            String ruleName,
            Double thresholdUsed,
            String message
    ) {
        return TelemetryAnomaly.builder()
                .missionId(point.getMissionId())
                .satelliteId(point.getSatelliteId())
                .metric(point.getMetric())
                .type(type)
                .severity(severity)
                .timestamp(point.getTimestamp())
                .value(point.getValue())
                .ruleName(ruleName)
                .thresholdUsed(thresholdUsed)
                .message(message)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private List<TelemetryAnomaly> saveWithoutDuplicates(List<TelemetryAnomaly> anomalies) {
        List<TelemetryAnomaly> savedAnomalies = new ArrayList<>();

        for (TelemetryAnomaly anomaly : anomalies) {
            boolean exists = telemetryAnomalyRepository.existsBySatelliteIdAndMetricAndTimestampAndTypeAndRuleName(
                    anomaly.getSatelliteId(),
                    anomaly.getMetric(),
                    anomaly.getTimestamp(),
                    anomaly.getType(),
                    anomaly.getRuleName()
            );

            if (exists) {
                continue;
            }

            try {
                savedAnomalies.add(telemetryAnomalyRepository.save(anomaly));
            } catch (DuplicateKeyException ignored) {
                // Protection supplémentaire si deux détections concurrentes créent la même anomalie.
            }
        }

        return savedAnomalies;
    }

    private void validateSatelliteExists(Long satelliteId) {
        if (!satelliteRepository.existsById(satelliteId)) {
            throw new ResourceNotFoundException("Satellite introuvable");
        }
    }

    private void validatePeriod(Instant from, Instant to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BusinessException("La date de début doit être antérieure à la date de fin");
        }
    }

    private List<String> normalizeMetrics(List<String> metrics) {
        List<String> normalizedMetrics = normalizeMetricsOrEmpty(metrics);

        if (normalizedMetrics.isEmpty()) {
            throw new BusinessException("Au moins une métrique est obligatoire");
        }

        return normalizedMetrics;
    }

    private List<String> normalizeMetricsOrEmpty(List<String> metrics) {
        if (metrics == null || metrics.isEmpty()) {
            return List.of();
        }

        return metrics.stream()
                .flatMap(metric -> Arrays.stream(metric.split(",")))
                .map(String::trim)
                .filter(metric -> !metric.isBlank())
                .distinct()
                .toList();
    }

    private TelemetryAnomalyResponse toResponse(TelemetryAnomaly anomaly) {
        return new TelemetryAnomalyResponse(
                anomaly.getId(),
                anomaly.getMissionId(),
                anomaly.getSatelliteId(),
                anomaly.getMetric(),
                anomaly.getType(),
                anomaly.getSeverity(),
                anomaly.getTimestamp(),
                anomaly.getValue(),
                anomaly.getPreviousValue(),
                anomaly.getPreviousTimestamp(),
                anomaly.getRuleName(),
                anomaly.getThresholdUsed(),
                anomaly.getMessage()
        );
    }

    private record MetricThresholdRule(
            Double warningMin,
            Double warningMax,
            Double criticalMax,
            Double criticalMin
    ) {
    }
}
