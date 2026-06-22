package com.finalspace.backend.telemetry.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.telemetry.TelemetryPoint;
import com.finalspace.backend.telemetry.dto.TelemetryPointResponse;
import com.finalspace.backend.telemetry.dto.TelemetryQueryResponse;
import com.finalspace.backend.telemetry.service.TelemetryQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TelemetryQueryServiceImpl implements TelemetryQueryService {

    private static final int DEFAULT_LIMIT = 5000;
    private static final int MAX_LIMIT = 5000;

    private final SatelliteRepository satelliteRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public List<String> getAvailableMetrics(Long satelliteId) {
        validateSatelliteExists(satelliteId);

        Query query = Query.query(Criteria.where("satelliteId").is(satelliteId));

        return mongoTemplate
                .findDistinct(
                        query,
                        "metric",
                        TelemetryPoint.class,
                        String.class
                )
                .stream()
                .sorted()
                .toList();
    }

    @Override
    public TelemetryQueryResponse getTelemetry(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to,
            Integer limit
    ) {
        validateSatelliteExists(satelliteId);

        List<String> normalizedMetrics = normalizeMetrics(metrics);
        validatePeriod(from, to);

        int resolvedLimit = resolveLimit(limit);

        Query query = new Query();

        query.addCriteria(
                Criteria.where("satelliteId").is(satelliteId)
                        .and("metric").in(normalizedMetrics)
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
        query.limit(resolvedLimit);

        List<TelemetryPointResponse> points = mongoTemplate.find(query, TelemetryPoint.class)
                .stream()
                .map(point -> new TelemetryPointResponse(
                        point.getTimestamp(),
                        point.getMetric(),
                        point.getValue()
                ))
                .toList();

        return new TelemetryQueryResponse(
                satelliteId,
                normalizedMetrics,
                points.size(),
                points
        );
    }

    private void validateSatelliteExists(Long satelliteId) {
        if (!satelliteRepository.existsById(satelliteId)) {
            throw new ResourceNotFoundException("Satellite introuvable");
        }
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

    private int resolveLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }

        if (limit < 1) {
            throw new BusinessException("La limite doit être supérieure à 0");
        }

        return Math.min(limit, MAX_LIMIT);
    }
}