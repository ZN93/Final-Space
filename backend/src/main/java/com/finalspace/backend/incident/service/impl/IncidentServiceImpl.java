package com.finalspace.backend.incident.service.impl;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.incident.Incident;
import com.finalspace.backend.incident.IncidentRepository;
import com.finalspace.backend.incident.IncidentStatus;
import com.finalspace.backend.incident.dto.IncidentCreateRequest;
import com.finalspace.backend.incident.dto.IncidentResponse;
import com.finalspace.backend.incident.dto.IncidentUpdateRequest;
import com.finalspace.backend.incident.service.IncidentService;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidentRepository;
    private final MissionRepository missionRepository;
    private final SatelliteRepository satelliteRepository;
    private final AlertRepository alertRepository;

    @Override
    public IncidentResponse create(Long missionId, IncidentCreateRequest request, String createdBy) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission introuvable"));

        if (mission.getStatus() == MissionStatus.CLOTUREE) {
            throw new BusinessException("Impossible de créer un incident dans une mission clôturée");
        }

        Satellite satellite = null;

        if (request.satelliteId() != null) {
            satellite = satelliteRepository.findById(request.satelliteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Satellite introuvable"));

            if (!satellite.getMission().getId().equals(missionId)) {
                throw new BusinessException("Le satellite n'appartient pas à la mission");
            }
        }

        Alert alert = null;

        if (request.alertId() != null) {
            alert = alertRepository.findById(request.alertId())
                    .orElseThrow(() -> new ResourceNotFoundException("Alerte introuvable"));

            if (!alert.getMission().getId().equals(missionId)) {
                throw new BusinessException("L'alerte n'appartient pas à la mission");
            }
        }

        LocalDateTime now = LocalDateTime.now();

        Incident incident = Incident.builder()
                .mission(mission)
                .satellite(satellite)
                .alert(alert)
                .title(request.title())
                .description(request.description())
                .notes(request.notes())
                .severity(request.severity())
                .status(IncidentStatus.OUVERT)
                .createdAt(now)
                .updatedAt(now)
                .closedAt(null)
                .createdBy(createdBy)
                .build();

        return toResponse(incidentRepository.save(incident));
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponse> findByMission(Long missionId, IncidentStatus status) {
        if (!missionRepository.existsById(missionId)) {
            throw new ResourceNotFoundException("Mission introuvable");
        }

        List<Incident> incidents = status == null
                ? incidentRepository.findByMissionIdOrderByCreatedAtDesc(missionId)
                : incidentRepository.findByMissionIdAndStatusOrderByCreatedAtDesc(missionId, status);

        return incidents.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public IncidentResponse findById(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident introuvable"));

        return toResponse(incident);
    }

    @Override
    public IncidentResponse update(Long id, IncidentUpdateRequest request) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident introuvable"));

        rejectIfClosed(incident);
        rejectIfMissionClosed(incident);

        incident.setTitle(request.title());
        incident.setDescription(request.description());
        incident.setNotes(request.notes());
        incident.setSeverity(request.severity());
        incident.setUpdatedAt(LocalDateTime.now());

        return toResponse(incidentRepository.save(incident));
    }

    @Override
    public IncidentResponse updateStatus(Long id, IncidentStatus status) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident introuvable"));

        rejectIfClosed(incident);
        rejectIfMissionClosed(incident);

        validateStatusTransition(incident.getStatus(), status);

        incident.setStatus(status);
        incident.setUpdatedAt(LocalDateTime.now());

        if (status == IncidentStatus.CLOTURE) {
            incident.setClosedAt(LocalDateTime.now());
        }

        return toResponse(incidentRepository.save(incident));
    }

    @Override
    public IncidentResponse close(Long id) {
        return updateStatus(id, IncidentStatus.CLOTURE);
    }

    private void rejectIfClosed(Incident incident) {
        if (incident.getStatus() == IncidentStatus.CLOTURE) {
            throw new BusinessException("Incident clôturé non modifiable");
        }
    }

    private void validateStatusTransition(IncidentStatus currentStatus, IncidentStatus targetStatus) {
        if (currentStatus == targetStatus) {
            return;
        }

        boolean validTransition =
                currentStatus == IncidentStatus.OUVERT && targetStatus == IncidentStatus.EN_COURS
                        || currentStatus == IncidentStatus.EN_COURS && targetStatus == IncidentStatus.CLOTURE
                        || currentStatus == IncidentStatus.OUVERT && targetStatus == IncidentStatus.CLOTURE;

        if (!validTransition) {
            throw new BusinessException("Transition de statut invalide");
        }
    }

    private IncidentResponse toResponse(Incident incident) {
        Mission mission = incident.getMission();
        Satellite satellite = incident.getSatellite();
        Alert alert = incident.getAlert();

        return new IncidentResponse(
                incident.getId(),
                mission.getId(),
                mission.getName(),
                satellite != null ? satellite.getId() : null,
                satellite != null ? satellite.getName() : null,
                alert != null ? alert.getId() : null,
                incident.getTitle(),
                incident.getDescription(),
                incident.getNotes(),
                incident.getSeverity(),
                incident.getStatus(),
                incident.getCreatedAt(),
                incident.getUpdatedAt(),
                incident.getClosedAt(),
                incident.getCreatedBy()
        );
    }

    private void rejectIfMissionClosed(Incident incident) {
        if (incident.getMission().getStatus() == MissionStatus.CLOTUREE) {
            throw new BusinessException("Incident non modifiable car la mission est clôturée");
        }
    }
}