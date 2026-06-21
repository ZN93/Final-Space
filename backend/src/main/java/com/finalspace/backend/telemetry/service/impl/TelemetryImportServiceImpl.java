package com.finalspace.backend.telemetry.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.telemetry.TelemetryImportException;
import com.finalspace.backend.telemetry.TelemetryPoint;
import com.finalspace.backend.telemetry.TelemetryPointRepository;
import com.finalspace.backend.telemetry.dto.TelemetryImportError;
import com.finalspace.backend.telemetry.dto.TelemetryImportResponse;
import com.finalspace.backend.telemetry.service.TelemetryImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TelemetryImportServiceImpl implements TelemetryImportService {

    private static final String EXPECTED_HEADER = "timestamp,metric,value";

    private final SatelliteRepository satelliteRepository;
    private final TelemetryPointRepository telemetryPointRepository;

    @Override
    public TelemetryImportResponse importCsv(
            Long missionId,
            Long satelliteId,
            MultipartFile file
    ) {
        Satellite satellite = satelliteRepository.findByIdWithMission(satelliteId)
                .orElseThrow(() -> new ResourceNotFoundException("Satellite introuvable"));

        validateSatelliteContext(missionId, satellite);
        validateFile(file);

        String importId = UUID.randomUUID().toString();
        List<TelemetryImportError> errors = new ArrayList<>();
        List<TelemetryPoint> points = parseCsv(missionId, satelliteId, file, importId, errors);

        if (!errors.isEmpty()) {
            throw new TelemetryImportException(errors);
        }

        telemetryPointRepository.saveAll(points);

        return new TelemetryImportResponse(
                importId,
                points.size(),
                0,
                List.of()
        );
    }

    private void validateSatelliteContext(Long missionId, Satellite satellite) {
        if (satellite.getMission() == null || !satellite.getMission().getId().equals(missionId)) {
            throw new BusinessException("Le satellite n'appartient pas à la mission indiquée");
        }

        if (satellite.getStatus() != SatelliteStatus.ACTIF) {
            throw new BusinessException("Le satellite doit être actif pour importer des données de télémétrie");
        }

        if (satellite.getMission().getStatus() == MissionStatus.CLOTUREE) {
            throw new BusinessException("La mission est clôturée");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Le fichier CSV est obligatoire");
        }

        String filename = file.getOriginalFilename();

        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            throw new BusinessException("Le fichier doit être au format CSV");
        }
    }

    private List<TelemetryPoint> parseCsv(
            Long missionId,
            Long satelliteId,
            MultipartFile file,
            String importId,
            List<TelemetryImportError> errors
    ) {
        List<TelemetryPoint> points = new ArrayList<>();

        try (
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)
                )
        ) {
            String header = reader.readLine();

            if (header == null || !EXPECTED_HEADER.equals(normalizeCsvValue(header))) {
                errors.add(new TelemetryImportError(
                        1,
                        "Header CSV invalide. Format attendu : timestamp,metric,value"
                ));
                return points;
            }

            String line;
            int lineNumber = 1;

            while ((line = reader.readLine()) != null) {
                lineNumber++;

                if (line.isBlank()) {
                    continue;
                }

                String[] columns = line.split(",", -1);

                if (columns.length != 3) {
                    errors.add(new TelemetryImportError(
                            lineNumber,
                            "La ligne doit contenir exactement 3 colonnes"
                    ));
                    continue;
                }

                Instant timestamp = parseTimestamp(columns[0], lineNumber, errors);
                String metric = parseMetric(columns[1], lineNumber, errors);
                Double value = parseValue(columns[2], lineNumber, errors);

                if (timestamp == null || metric == null || value == null) {
                    continue;
                }

                points.add(TelemetryPoint.builder()
                        .missionId(missionId)
                        .satelliteId(satelliteId)
                        .timestamp(timestamp)
                        .metric(metric)
                        .value(value)
                        .sourceImportId(importId)
                        .createdAt(LocalDateTime.now())
                        .build());
            }
        } catch (Exception exception) {
            errors.add(new TelemetryImportError(
                    0,
                    "Impossible de lire le fichier CSV"
            ));
        }

        if (points.isEmpty() && errors.isEmpty()) {
            errors.add(new TelemetryImportError(
                    0,
                    "Le fichier CSV ne contient aucune donnée"
            ));
        }

        return points;
    }

    private Instant parseTimestamp(
            String rawTimestamp,
            int lineNumber,
            List<TelemetryImportError> errors
    ) {
        try {
            return Instant.parse(normalizeCsvValue(rawTimestamp));
        } catch (Exception exception) {
            errors.add(new TelemetryImportError(
                    lineNumber,
                    "Timestamp invalide. Format attendu : ISO-8601, exemple 2026-01-01T10:00:00Z"
            ));
            return null;
        }
    }

    private String parseMetric(
            String rawMetric,
            int lineNumber,
            List<TelemetryImportError> errors
    ) {
        String metric = normalizeCsvValue(rawMetric);

        if (metric.isBlank()) {
            errors.add(new TelemetryImportError(
                    lineNumber,
                    "La métrique est obligatoire"
            ));
            return null;
        }

        return metric;
    }

    private Double parseValue(
            String rawValue,
            int lineNumber,
            List<TelemetryImportError> errors
    ) {
        try {
            return Double.parseDouble(normalizeCsvValue(rawValue));
        } catch (Exception exception) {
            errors.add(new TelemetryImportError(
                    lineNumber,
                    "La valeur doit être numérique"
            ));
            return null;
        }
    }

    private String normalizeCsvValue(String value) {
        return value == null
                ? ""
                : value.replace("\uFEFF", "").trim();
    }
}