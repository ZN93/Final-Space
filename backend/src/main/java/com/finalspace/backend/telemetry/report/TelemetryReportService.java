package com.finalspace.backend.telemetry.report;

import java.time.Instant;
import java.util.List;

public interface TelemetryReportService {

    byte[] generateTelemetryReportCsv(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to
    );

    byte[] generateTelemetryReportPdf(
            Long satelliteId,
            List<String> metrics,
            Instant from,
            Instant to,
            String generatedBy
    );

    String buildCsvFilename(Long satelliteId);

    String buildPdfFilename(Long satelliteId);
}