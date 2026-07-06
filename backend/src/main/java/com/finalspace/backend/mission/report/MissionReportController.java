package com.finalspace.backend.mission.report;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/missions/{missionId}/report")
public class MissionReportController {

    private final MissionReportService missionReportService;

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> generateMissionReportPdf(
            @PathVariable Long missionId,
            Authentication authentication
    ) {
        byte[] pdf = missionReportService.generateMissionReportPdf(
                missionId,
                authentication.getName()
        );

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(missionReportService.buildReportFilename(missionId), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(pdf);
    }
}