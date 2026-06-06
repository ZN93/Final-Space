package com.finalspace.backend.satellite.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.satellite.dto.SatelliteCreateRequest;
import com.finalspace.backend.satellite.dto.SatelliteResponse;
import com.finalspace.backend.satellite.dto.SatelliteUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SatelliteServiceImplTest {

    @Mock
    private SatelliteRepository satelliteRepository;

    @Mock
    private MissionRepository missionRepository;

    @InjectMocks
    private SatelliteServiceImpl satelliteService;

    private Mission activeMission;
    private Mission closedMission;
    private Satellite activeSatellite;

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

        closedMission = Mission.builder()
                .id(2L)
                .name("Mission Clôturée")
                .description("Mission clôturée")
                .status(MissionStatus.CLOTUREE)
                .createdAt(LocalDateTime.now())
                .closedAt(LocalDateTime.now())
                .build();

        activeSatellite = Satellite.builder()
                .id(1L)
                .name("LunaSat-01")
                .status(SatelliteStatus.ACTIF)
                .massKg(850.0)
                .altitudeKm(400.0)
                .inclinationDeg(51.6)
                .eccentricity(0.001)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .mission(activeMission)
                .build();
    }

    @Test
    void shouldCreateSatelliteInActiveMission() {
        SatelliteCreateRequest request = new SatelliteCreateRequest(
                "LunaSat-01",
                850.0,
                400.0,
                51.6,
                0.001
        );

        when(missionRepository.findById(1L)).thenReturn(Optional.of(activeMission));

        when(satelliteRepository.save(any(Satellite.class)))
                .thenAnswer(invocation -> {
                    Satellite satellite = invocation.getArgument(0);
                    satellite.setId(1L);
                    return satellite;
                });

        SatelliteResponse response = satelliteService.create(1L, request);

        ArgumentCaptor<Satellite> captor = ArgumentCaptor.forClass(Satellite.class);
        verify(satelliteRepository).save(captor.capture());

        Satellite savedSatellite = captor.getValue();

        assertEquals("LunaSat-01", response.name());
        assertEquals(SatelliteStatus.ACTIF, response.status());
        assertEquals(1L, response.missionId());
        assertEquals("Mission Artemis", response.missionName());

        assertEquals(SatelliteStatus.ACTIF, savedSatellite.getStatus());
        assertEquals(activeMission, savedSatellite.getMission());
        assertNotNull(savedSatellite.getCreatedAt());
        assertNotNull(savedSatellite.getUpdatedAt());
    }

    @Test
    void shouldRejectCreateSatelliteWhenMissionDoesNotExist() {
        SatelliteCreateRequest request = new SatelliteCreateRequest(
                "LunaSat-01",
                850.0,
                400.0,
                51.6,
                0.001
        );

        when(missionRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> satelliteService.create(99L, request)
        );

        assertEquals("Mission introuvable", exception.getMessage());

        verify(satelliteRepository, never()).save(any(Satellite.class));
    }

    @Test
    void shouldRejectCreateSatelliteInClosedMission() {
        SatelliteCreateRequest request = new SatelliteCreateRequest(
                "LunaSat-01",
                850.0,
                400.0,
                51.6,
                0.001
        );

        when(missionRepository.findById(2L)).thenReturn(Optional.of(closedMission));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> satelliteService.create(2L, request)
        );

        assertEquals(
                "Impossible de créer un satellite dans une mission clôturée",
                exception.getMessage()
        );

        verify(satelliteRepository, never()).save(any(Satellite.class));
    }

    @Test
    void shouldReturnSatellitesByMission() {
        when(missionRepository.existsById(1L)).thenReturn(true);
        when(satelliteRepository.findByMissionId(1L)).thenReturn(List.of(activeSatellite));

        List<SatelliteResponse> responses = satelliteService.findByMission(1L);

        assertEquals(1, responses.size());
        assertEquals("LunaSat-01", responses.get(0).name());
        assertEquals(1L, responses.get(0).missionId());

        verify(missionRepository).existsById(1L);
        verify(satelliteRepository).findByMissionId(1L);
    }

    @Test
    void shouldRejectFindByMissionWhenMissionDoesNotExist() {
        when(missionRepository.existsById(99L)).thenReturn(false);

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> satelliteService.findByMission(99L)
        );

        assertEquals("Mission introuvable", exception.getMessage());

        verify(satelliteRepository, never()).findByMissionId(anyLong());
    }

    @Test
    void shouldReturnSatelliteById() {
        when(satelliteRepository.findById(1L)).thenReturn(Optional.of(activeSatellite));

        SatelliteResponse response = satelliteService.findById(1L);

        assertEquals(1L, response.id());
        assertEquals("LunaSat-01", response.name());
        assertEquals(SatelliteStatus.ACTIF, response.status());
        assertEquals(1L, response.missionId());

        verify(satelliteRepository).findById(1L);
    }

    @Test
    void shouldRejectFindByIdWhenSatelliteDoesNotExist() {
        when(satelliteRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> satelliteService.findById(99L)
        );

        assertEquals("Satellite introuvable", exception.getMessage());
    }

    @Test
    void shouldUpdateActiveSatellite() {
        SatelliteUpdateRequest request = new SatelliteUpdateRequest(
                "LunaSat-01 Updated",
                900.0,
                420.0,
                52.0,
                0.002
        );

        when(satelliteRepository.findById(1L)).thenReturn(Optional.of(activeSatellite));
        when(satelliteRepository.save(activeSatellite)).thenReturn(activeSatellite);

        SatelliteResponse response = satelliteService.update(1L, request);

        assertEquals("LunaSat-01 Updated", response.name());
        assertEquals(900.0, response.massKg());
        assertEquals(420.0, response.altitudeKm());
        assertEquals(52.0, response.inclinationDeg());
        assertEquals(0.002, response.eccentricity());

        verify(satelliteRepository).save(activeSatellite);
    }

    @Test
    void shouldRejectUpdateWhenSatelliteIsInactive() {
        Satellite inactiveSatellite = Satellite.builder()
                .id(1L)
                .name("LunaSat-01")
                .status(SatelliteStatus.INACTIF)
                .massKg(850.0)
                .altitudeKm(400.0)
                .inclinationDeg(51.6)
                .eccentricity(0.001)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .mission(activeMission)
                .build();

        SatelliteUpdateRequest request = new SatelliteUpdateRequest(
                "LunaSat-01 Updated",
                900.0,
                420.0,
                52.0,
                0.002
        );

        when(satelliteRepository.findById(1L)).thenReturn(Optional.of(inactiveSatellite));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> satelliteService.update(1L, request)
        );

        assertEquals("Un satellite inactif ne peut pas être modifié", exception.getMessage());

        verify(satelliteRepository, never()).save(any(Satellite.class));
    }

    @Test
    void shouldDisableActiveSatellite() {
        when(satelliteRepository.findById(1L)).thenReturn(Optional.of(activeSatellite));
        when(satelliteRepository.save(activeSatellite)).thenReturn(activeSatellite);

        SatelliteResponse response = satelliteService.disable(1L);

        assertEquals(SatelliteStatus.INACTIF, response.status());

        verify(satelliteRepository).save(activeSatellite);
    }

    @Test
    void shouldReturnInactiveSatelliteWithoutSavingAgainWhenAlreadyInactive() {
        Satellite inactiveSatellite = Satellite.builder()
                .id(1L)
                .name("LunaSat-01")
                .status(SatelliteStatus.INACTIF)
                .massKg(850.0)
                .altitudeKm(400.0)
                .inclinationDeg(51.6)
                .eccentricity(0.001)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .mission(activeMission)
                .build();

        when(satelliteRepository.findById(1L)).thenReturn(Optional.of(inactiveSatellite));

        SatelliteResponse response = satelliteService.disable(1L);

        assertEquals(SatelliteStatus.INACTIF, response.status());

        verify(satelliteRepository, never()).save(any(Satellite.class));
    }
}