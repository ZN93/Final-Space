package com.finalspace.backend.dashboard.service;

import com.finalspace.backend.dashboard.dto.MissionDashboardResponse;

public interface MissionDashboardService {

    MissionDashboardResponse getMissionDashboard(Long missionId);
}