package com.finalspace.backend.telemetry.controller;

import com.finalspace.backend.telemetry.dto.TelemetryImportResponse;
import com.finalspace.backend.telemetry.service.TelemetryImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class TelemetryController {

    private final TelemetryImportService telemetryImportService;

    @PostMapping("/missions/{missionId}/satellites/{satelliteId}/telemetry/import")
    @ResponseStatus(HttpStatus.CREATED)
    public TelemetryImportResponse importTelemetryCsv(
            @PathVariable Long missionId,
            @PathVariable Long satelliteId,
            @RequestParam("file") MultipartFile file
    ) {
        return telemetryImportService.importCsv(missionId, satelliteId, file);
    }
}