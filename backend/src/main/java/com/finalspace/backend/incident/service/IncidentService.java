package com.finalspace.backend.incident.service;

import com.finalspace.backend.incident.IncidentStatus;
import com.finalspace.backend.incident.dto.IncidentCreateRequest;
import com.finalspace.backend.incident.dto.IncidentResponse;
import com.finalspace.backend.incident.dto.IncidentUpdateRequest;

import java.util.List;

public interface IncidentService {

    IncidentResponse create(Long missionId, IncidentCreateRequest request, String createdBy);

    List<IncidentResponse> findByMission(Long missionId, IncidentStatus status);

    IncidentResponse findById(Long id);

    IncidentResponse update(Long id, IncidentUpdateRequest request);

    IncidentResponse updateStatus(Long id, IncidentStatus status);

    IncidentResponse close(Long id);
}