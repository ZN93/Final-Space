package com.finalspace.backend.telemetry.anomaly.controller;

import com.finalspace.backend.telemetry.anomaly.dto.TelemetryAnomalyDetectionResponse;
import com.finalspace.backend.telemetry.anomaly.dto.TelemetryAnomalyQueryResponse;
import com.finalspace.backend.telemetry.anomaly.service.TelemetryAnomalyDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/satellites/{satelliteId}/anomalies")
public class TelemetryAnomalyController {

    private final TelemetryAnomalyDetectionService telemetryAnomalyDetectionService;

    @PostMapping("/detect")
    public TelemetryAnomalyDetectionResponse detectAnomalies(
            @PathVariable Long satelliteId,
            @RequestParam(value = "metric", required = false) List<String> metrics,
            @RequestParam(value = "from", required = false) Instant from,
            @RequestParam(value = "to", required = false) Instant to
    ) {
        return telemetryAnomalyDetectionService.detectAnomalies(
                satelliteId,
                metrics,
                from,
                to
        );
    }

    @GetMapping
    public TelemetryAnomalyQueryResponse getAnomalies(
            @PathVariable Long satelliteId,
            @RequestParam(value = "metric", required = false) List<String> metrics,
            @RequestParam(value = "from", required = false) Instant from,
            @RequestParam(value = "to", required = false) Instant to
    ) {
        return telemetryAnomalyDetectionService.getAnomalies(
                satelliteId,
                metrics,
                from,
                to
        );
    }
}