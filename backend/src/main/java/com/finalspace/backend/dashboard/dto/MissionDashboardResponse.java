package com.finalspace.backend.dashboard.dto;

import com.finalspace.backend.mission.MissionStatus;

import java.util.List;

public record MissionDashboardResponse(
        Long missionId,
        String missionName,
        MissionStatus missionStatus,

        long totalSatellites,
        long activeSatellites,
        long inactiveSatellites,

        long activeAlerts,
        long acknowledgedAlerts,

        long openIncidents,
        long inProgressIncidents,
        long closedIncidents,

        List<String> lastSimulations,
        List<String> lastTelemetryImports
) {
}