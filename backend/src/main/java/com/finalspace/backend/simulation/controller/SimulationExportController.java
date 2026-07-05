package com.finalspace.backend.simulation.controller;

import com.finalspace.backend.simulation.export.SimulationExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/simulations/{id}/export")
public class SimulationExportController {

    private final SimulationExportService simulationExportService;

    @GetMapping("/csv")
    public ResponseEntity<byte[]> exportCsv(@PathVariable Long id) {
        byte[] csv = simulationExportService.generateSimulationCsv(id);

        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(simulationExportService.buildCsvFilename(id), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(csv);
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long id) {
        byte[] pdf = simulationExportService.generateSimulationPdf(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(simulationExportService.buildPdfFilename(id), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(pdf);
    }
}