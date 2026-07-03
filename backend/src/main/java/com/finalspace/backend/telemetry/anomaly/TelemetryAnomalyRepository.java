package com.finalspace.backend.telemetry.anomaly;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface TelemetryAnomalyRepository extends MongoRepository<TelemetryAnomaly, String> {

    boolean existsBySatelliteIdAndMetricAndTimestampAndTypeAndRuleName(
            Long satelliteId,
            String metric,
            Instant timestamp,
            TelemetryAnomalyType type,
            String ruleName
    );

    List<TelemetryAnomaly> findBySatelliteIdOrderByTimestampDesc(Long satelliteId);
}