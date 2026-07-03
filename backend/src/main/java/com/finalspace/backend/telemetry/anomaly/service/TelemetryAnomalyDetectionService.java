package com.finalspace.backend.telemetry.anomaly.service;

import com.finalspace.backend.telemetry.anomaly.dto.TelemetryAnomalyDetectionResponse;
import com.finalspace.backend.telemetry.anomaly.dto.TelemetryAnomalyQueryResponse;

import java.time.Instant;
import java.util.List;

public interface TelemetryAnomalyDetectionService {

    TelemetryAnomalyDetectionResponse detectAnomalies(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to
    );

    TelemetryAnomalyQueryResponse getAnomalies(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to
    );
}