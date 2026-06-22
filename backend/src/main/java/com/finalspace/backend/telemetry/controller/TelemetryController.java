package com.finalspace.backend.telemetry.controller;

import com.finalspace.backend.telemetry.dto.TelemetryImportResponse;
import com.finalspace.backend.telemetry.dto.TelemetryQueryResponse;
import com.finalspace.backend.telemetry.service.TelemetryQueryService;
import com.finalspace.backend.telemetry.service.TelemetryImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class TelemetryController {

    private final TelemetryImportService telemetryImportService;
    private final TelemetryQueryService telemetryQueryService;

    @PostMapping("/missions/{missionId}/satellites/{satelliteId}/telemetry/import")
    @ResponseStatus(HttpStatus.CREATED)
    public TelemetryImportResponse importTelemetryCsv(
            @PathVariable Long missionId,
            @PathVariable Long satelliteId,
            @RequestParam("file") MultipartFile file
    ) {
        return telemetryImportService.importCsv(missionId, satelliteId, file);
    }

    @GetMapping("/satellites/{satelliteId}/telemetry/metrics")
    public List<String> getTelemetryMetrics(
            @PathVariable Long satelliteId
    ) {
        return telemetryQueryService.getAvailableMetrics(satelliteId);
    }

    @GetMapping("/satellites/{satelliteId}/telemetry")
    public TelemetryQueryResponse getTelemetry(
            @PathVariable Long satelliteId,
            @RequestParam(value = "metric", required = false) List<String> metrics,
            @RequestParam(value = "from", required = false) Instant from,
            @RequestParam(value = "to", required = false) Instant to,
            @RequestParam(value = "limit", required = false) Integer limit
    ) {
        return telemetryQueryService.getTelemetry(
                satelliteId,
                metrics,
                from,
                to,
                limit
        );
    }
}