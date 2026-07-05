package com.finalspace.backend.alert.service.impl;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.alert.AlertSeverity;
import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.alert.service.AnomalyAlertGenerationService;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomaly;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AnomalyAlertGenerationServiceImpl implements AnomalyAlertGenerationService {

    private final AlertRepository alertRepository;
    private final MissionRepository missionRepository;
    private final SatelliteRepository satelliteRepository;

    @Override
    public void generateAlertsFromAnomalies(List<TelemetryAnomaly> anomalies) {
        if (anomalies == null || anomalies.isEmpty()) {
            return;
        }

        for (TelemetryAnomaly anomaly : anomalies) {
            generateAlertFromAnomaly(anomaly);
        }
    }

    private void generateAlertFromAnomaly(TelemetryAnomaly anomaly) {
        if (anomaly.getId() == null || alertRepository.existsByAnomalyId(anomaly.getId())) {
            return;
        }

        Mission mission = missionRepository.findById(anomaly.getMissionId())
                .orElse(null);

        if (mission == null) {
            return;
        }

        Satellite satellite = anomaly.getSatelliteId() == null
                ? null
                : satelliteRepository.findById(anomaly.getSatelliteId()).orElse(null);

        Alert alert = Alert.builder()
                .mission(mission)
                .satellite(satellite)
                .metric(anomaly.getMetric())
                .type("ANOMALY_" + anomaly.getType().name())
                .severity(AlertSeverity.valueOf(anomaly.getSeverity().name()))
                .status(AlertStatus.ACTIVE)
                .message(buildAlertMessage(anomaly))
                .anomalyId(anomaly.getId())
                .telemetryValue(anomaly.getValue())
                .telemetryTimestamp(anomaly.getTimestamp())
                .createdAt(LocalDateTime.now())
                .build();

        try {
            alertRepository.save(alert);
        } catch (DataIntegrityViolationException ignored) {
            // Protection contre les doublons si deux détections concurrentes créent la même alerte.
        }
    }

    private String buildAlertMessage(TelemetryAnomaly anomaly) {
        return "Anomalie "
                + anomaly.getType().name()
                + " détectée sur la métrique "
                + anomaly.getMetric()
                + " avec la valeur "
                + anomaly.getValue()
                + ". "
                + anomaly.getMessage();
    }
}