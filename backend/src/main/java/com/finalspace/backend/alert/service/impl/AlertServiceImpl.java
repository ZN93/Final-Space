package com.finalspace.backend.alert.service.impl;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.alert.dto.AlertResponse;
import com.finalspace.backend.alert.service.AlertService;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.satellite.Satellite;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.finalspace.backend.common.exception.BusinessException;
import java.time.LocalDateTime;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepository;
    private final MissionRepository missionRepository;

    @Override
    public List<AlertResponse> findByMission(Long missionId, AlertStatus status) {
        if (!missionRepository.existsById(missionId)) {
            throw new ResourceNotFoundException("Mission introuvable");
        }

        List<Alert> alerts;

        if (status == null) {
            alerts = alertRepository.findByMissionIdOrderByCreatedAtDesc(missionId);
        } else {
            alerts = alertRepository.findByMissionIdAndStatusOrderByCreatedAtDesc(missionId, status);
        }

        return alerts.stream()
                .map(this::toResponse)
                .toList();
    }

    private AlertResponse toResponse(Alert alert) {
        Mission mission = alert.getMission();
        Satellite satellite = alert.getSatellite();

        return new AlertResponse(
                alert.getId(),
                mission.getId(),
                mission.getName(),
                satellite != null ? satellite.getId() : null,
                satellite != null ? satellite.getName() : null,
                alert.getMetric(),
                alert.getType(),
                alert.getSeverity(),
                alert.getStatus(),
                alert.getMessage(),
                alert.getAnomalyId(),
                alert.getTelemetryValue(),
                alert.getTelemetryTimestamp(),
                alert.getCreatedAt(),
                alert.getAckAt(),
                alert.getAckBy()
        );
    }

    @Override
    @Transactional
    public AlertResponse acknowledge(Long alertId, String acknowledgedBy) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerte introuvable"));

        if (alert.getStatus() == AlertStatus.ACQUITTEE) {
            throw new BusinessException("Alerte déjà acquittée");
        }

        alert.setStatus(AlertStatus.ACQUITTEE);
        alert.setAckAt(LocalDateTime.now());
        alert.setAckBy(acknowledgedBy);

        Alert savedAlert = alertRepository.save(alert);

        return toResponse(savedAlert);
    }
}