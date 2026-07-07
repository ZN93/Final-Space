package com.finalspace.backend.telemetry.report;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/satellites/{satelliteId}/telemetry/report")
public class TelemetryReportController {

    private final TelemetryReportService telemetryReportService;

    @GetMapping("/csv")
    public ResponseEntity<byte[]> exportCsv(
            @PathVariable Long satelliteId,
            @RequestParam(value = "metric") List<String> metrics,
            @RequestParam(value = "from", required = false) Instant from,
            @RequestParam(value = "to", required = false) Instant to
    ) {
        byte[] csv = telemetryReportService.generateTelemetryReportCsv(
                satelliteId,
                metrics,
                from,
                to
        );

        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(telemetryReportService.buildCsvFilename(satelliteId), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(csv);
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable Long satelliteId,
            @RequestParam(value = "metric") List<String> metrics,
            @RequestParam(value = "from", required = false) Instant from,
            @RequestParam(value = "to", required = false) Instant to,
            Authentication authentication
    ) {
        byte[] pdf = telemetryReportService.generateTelemetryReportPdf(
                satelliteId,
                metrics,
                from,
                to,
                authentication.getName()
        );

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(telemetryReportService.buildPdfFilename(satelliteId), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(pdf);
    }
}