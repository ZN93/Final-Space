package com.finalspace.backend.dashboard.controller;

import com.finalspace.backend.dashboard.dto.MissionDashboardResponse;
import com.finalspace.backend.dashboard.service.MissionDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/missions")
public class MissionDashboardController {

    private final MissionDashboardService missionDashboardService;

    @GetMapping("/{id}/dashboard")
    public MissionDashboardResponse getMissionDashboard(@PathVariable Long id) {
        return missionDashboardService.getMissionDashboard(id);
    }
}