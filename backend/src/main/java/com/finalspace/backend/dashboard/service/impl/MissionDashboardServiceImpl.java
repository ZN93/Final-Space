package com.finalspace.backend.dashboard.service.impl;

import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.dashboard.dto.MissionDashboardResponse;
import com.finalspace.backend.dashboard.service.MissionDashboardService;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MissionDashboardServiceImpl implements MissionDashboardService {

    private final MissionRepository missionRepository;
    private final SatelliteRepository satelliteRepository;

    @Override
    public MissionDashboardResponse getMissionDashboard(Long missionId) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission introuvable"));

        long totalSatellites = satelliteRepository.countByMissionId(missionId);
        long activeSatellites = satelliteRepository.countByMissionIdAndStatus(missionId, SatelliteStatus.ACTIF);
        long inactiveSatellites = satelliteRepository.countByMissionIdAndStatus(missionId, SatelliteStatus.INACTIF);

        return new MissionDashboardResponse(
                mission.getId(),
                mission.getName(),
                mission.getStatus(),

                totalSatellites,
                activeSatellites,
                inactiveSatellites,

                0,
                0,

                0,
                0,
                0,

                List.of(),
                List.of()
        );
    }
}