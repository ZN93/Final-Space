package com.finalspace.backend.satellite.service;

import com.finalspace.backend.satellite.dto.SatelliteCreateRequest;
import com.finalspace.backend.satellite.dto.SatelliteResponse;
import com.finalspace.backend.satellite.dto.SatelliteUpdateRequest;

import java.util.List;

public interface SatelliteService {

    SatelliteResponse create(Long missionId, SatelliteCreateRequest request);

    List<SatelliteResponse> findByMission(Long missionId);

    SatelliteResponse findById(Long id);

    SatelliteResponse update(Long id, SatelliteUpdateRequest request);

    SatelliteResponse disable(Long id);
}