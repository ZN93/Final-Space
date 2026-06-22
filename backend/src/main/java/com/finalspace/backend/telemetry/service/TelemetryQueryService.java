package com.finalspace.backend.telemetry.service;

import com.finalspace.backend.telemetry.dto.TelemetryQueryResponse;

import java.time.Instant;
import java.util.List;

public interface TelemetryQueryService {

    List<String> getAvailableMetrics(Long satelliteId);

    TelemetryQueryResponse getTelemetry(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to,
            Integer limit
    );
}