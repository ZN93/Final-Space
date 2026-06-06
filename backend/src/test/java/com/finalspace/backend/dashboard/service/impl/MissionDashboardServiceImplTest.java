package com.finalspace.backend.dashboard.service.impl;

import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.dashboard.dto.MissionDashboardResponse;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MissionDashboardServiceImplTest {

    @Mock
    private MissionRepository missionRepository;

    @Mock
    private SatelliteRepository satelliteRepository;

    @InjectMocks
    private MissionDashboardServiceImpl missionDashboardService;

    private Mission activeMission;

    @BeforeEach
    void setUp() {
        activeMission = Mission.builder()
                .id(1L)
                .name("Mission Artemis")
                .description("Mission active")
                .status(MissionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .closedAt(null)
                .build();
    }

    @Test
    void shouldReturnMissionDashboardWithSatelliteKpis() {
        when(missionRepository.findById(1L)).thenReturn(Optional.of(activeMission));
        when(satelliteRepository.countByMissionId(1L)).thenReturn(5L);
        when(satelliteRepository.countByMissionIdAndStatus(1L, SatelliteStatus.ACTIF)).thenReturn(3L);
        when(satelliteRepository.countByMissionIdAndStatus(1L, SatelliteStatus.INACTIF)).thenReturn(2L);

        MissionDashboardResponse response = missionDashboardService.getMissionDashboard(1L);

        assertEquals(1L, response.missionId());
        assertEquals("Mission Artemis", response.missionName());
        assertEquals(MissionStatus.ACTIVE, response.missionStatus());

        assertEquals(5L, response.totalSatellites());
        assertEquals(3L, response.activeSatellites());
        assertEquals(2L, response.inactiveSatellites());

        assertEquals(0L, response.activeAlerts());
        assertEquals(0L, response.acknowledgedAlerts());

        assertEquals(0L, response.openIncidents());
        assertEquals(0L, response.inProgressIncidents());
        assertEquals(0L, response.closedIncidents());

        assertTrue(response.lastSimulations().isEmpty());
        assertTrue(response.lastTelemetryImports().isEmpty());

        verify(missionRepository).findById(1L);
        verify(satelliteRepository).countByMissionId(1L);
        verify(satelliteRepository).countByMissionIdAndStatus(1L, SatelliteStatus.ACTIF);
        verify(satelliteRepository).countByMissionIdAndStatus(1L, SatelliteStatus.INACTIF);
    }

    @Test
    void shouldReturnDashboardForClosedMission() {
        Mission closedMission = Mission.builder()
                .id(2L)
                .name("Mission clôturée")
                .description("Mission clôturée")
                .status(MissionStatus.CLOTUREE)
                .createdAt(LocalDateTime.now())
                .closedAt(LocalDateTime.now())
                .build();

        when(missionRepository.findById(2L)).thenReturn(Optional.of(closedMission));
        when(satelliteRepository.countByMissionId(2L)).thenReturn(2L);
        when(satelliteRepository.countByMissionIdAndStatus(2L, SatelliteStatus.ACTIF)).thenReturn(0L);
        when(satelliteRepository.countByMissionIdAndStatus(2L, SatelliteStatus.INACTIF)).thenReturn(2L);

        MissionDashboardResponse response = missionDashboardService.getMissionDashboard(2L);

        assertEquals(2L, response.missionId());
        assertEquals("Mission clôturée", response.missionName());
        assertEquals(MissionStatus.CLOTUREE, response.missionStatus());
        assertEquals(2L, response.totalSatellites());
        assertEquals(0L, response.activeSatellites());
        assertEquals(2L, response.inactiveSatellites());
    }

    @Test
    void shouldRejectDashboardWhenMissionDoesNotExist() {
        when(missionRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> missionDashboardService.getMissionDashboard(99L)
        );

        assertEquals("Mission introuvable", exception.getMessage());

        verify(satelliteRepository, never()).countByMissionId(anyLong());
        verify(satelliteRepository, never()).countByMissionIdAndStatus(anyLong(), any());
    }
}