package com.finalspace.backend.satellite.controller;

import com.finalspace.backend.satellite.dto.SatelliteCreateRequest;
import com.finalspace.backend.satellite.dto.SatelliteResponse;
import com.finalspace.backend.satellite.dto.SatelliteUpdateRequest;
import com.finalspace.backend.satellite.service.SatelliteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class SatelliteController {

    private final SatelliteService satelliteService;

    @PostMapping("/missions/{missionId}/satellites")
    @ResponseStatus(HttpStatus.CREATED)
    public SatelliteResponse create(
            @PathVariable Long missionId,
            @Valid @RequestBody SatelliteCreateRequest request
    ) {
        return satelliteService.create(missionId, request);
    }

    @GetMapping("/missions/{missionId}/satellites")
    public List<SatelliteResponse> findByMission(@PathVariable Long missionId) {
        return satelliteService.findByMission(missionId);
    }

    @GetMapping("/satellites/{id}")
    public SatelliteResponse findById(@PathVariable Long id) {
        return satelliteService.findById(id);
    }

    @PutMapping("/satellites/{id}")
    public SatelliteResponse update(
            @PathVariable Long id,
            @Valid @RequestBody SatelliteUpdateRequest request
    ) {
        return satelliteService.update(id, request);
    }

    @PostMapping("/satellites/{id}/disable")
    public SatelliteResponse disable(@PathVariable Long id) {
        return satelliteService.disable(id);
    }
}