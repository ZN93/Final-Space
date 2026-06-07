package com.finalspace.backend.incident.controller;

import com.finalspace.backend.incident.IncidentStatus;
import com.finalspace.backend.incident.dto.IncidentCreateRequest;
import com.finalspace.backend.incident.dto.IncidentResponse;
import com.finalspace.backend.incident.dto.IncidentStatusUpdateRequest;
import com.finalspace.backend.incident.dto.IncidentUpdateRequest;
import com.finalspace.backend.incident.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    @PostMapping("/api/missions/{missionId}/incidents")
    @ResponseStatus(HttpStatus.CREATED)
    public IncidentResponse create(
            @PathVariable Long missionId,
            @Valid @RequestBody IncidentCreateRequest request,
            Authentication authentication
    ) {
        return incidentService.create(missionId, request, authentication.getName());
    }

    @GetMapping("/api/missions/{missionId}/incidents")
    public List<IncidentResponse> findByMission(
            @PathVariable Long missionId,
            @RequestParam(required = false) IncidentStatus status
    ) {
        return incidentService.findByMission(missionId, status);
    }

    @GetMapping("/api/incidents/{id}")
    public IncidentResponse findById(@PathVariable Long id) {
        return incidentService.findById(id);
    }

    @PutMapping("/api/incidents/{id}")
    public IncidentResponse update(
            @PathVariable Long id,
            @Valid @RequestBody IncidentUpdateRequest request
    ) {
        return incidentService.update(id, request);
    }

    @PostMapping("/api/incidents/{id}/status")
    public IncidentResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody IncidentStatusUpdateRequest request
    ) {
        return incidentService.updateStatus(id, request.status());
    }

    @PostMapping("/api/incidents/{id}/close")
    public IncidentResponse close(@PathVariable Long id) {
        return incidentService.close(id);
    }
}