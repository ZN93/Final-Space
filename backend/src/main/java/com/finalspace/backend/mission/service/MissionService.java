package com.finalspace.backend.mission.service;

import com.finalspace.backend.mission.dto.MissionCreateRequest;
import com.finalspace.backend.mission.dto.MissionResponse;
import com.finalspace.backend.mission.dto.MissionUpdateRequest;

import java.util.List;

public interface MissionService {

    MissionResponse create(MissionCreateRequest request);

    List<MissionResponse> findAll();

    MissionResponse findById(Long id);

    MissionResponse update(Long id, MissionUpdateRequest request);

    MissionResponse close(Long id);
}