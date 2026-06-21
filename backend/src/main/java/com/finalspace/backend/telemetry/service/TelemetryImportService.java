package com.finalspace.backend.telemetry.service;

import com.finalspace.backend.telemetry.dto.TelemetryImportResponse;
import org.springframework.web.multipart.MultipartFile;

public interface TelemetryImportService {

    TelemetryImportResponse importCsv(
            Long missionId,
            Long satelliteId,
            MultipartFile file
    );
}