package com.finalspace.backend.simulation.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.simulation.SimulationRun;
import com.finalspace.backend.simulation.SimulationRunRepository;
import com.finalspace.backend.simulation.SimulationStatus;
import com.finalspace.backend.simulation.SimulationType;
import com.finalspace.backend.simulation.dto.OrbitSimulationResult;
import com.finalspace.backend.simulation.dto.SimulationResponse;
import com.finalspace.backend.simulation.service.OrbitSimulationService;
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
class SimulationServiceImplTest {

    @Mock
    private SatelliteRepository satelliteRepository;

    @Mock
    private SimulationRunRepository simulationRunRepository;

    @Mock
    private OrbitSimulationService orbitSimulationService;

    @InjectMocks
    private SimulationServiceImpl simulationService;

    private Mission activeMission;
    private Mission closedMission;
    private Satellite activeSatellite;
    private Satellite inactiveSatellite;
    private Satellite satelliteOnClosedMission;

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
                .name("Mission clôturée")
                .description("Mission clôturée")
                .status(MissionStatus.CLOTUREE)
                .createdAt(LocalDateTime.now())
                .closedAt(LocalDateTime.now())
                .build();

        activeSatellite = Satellite.builder()
                .id(10L)
                .name("LunaSat-01")
                .status(SatelliteStatus.ACTIF)
                .massKg(900.0)
                .altitudeKm(420.0)
                .inclinationDeg(52.0)
                .eccentricity(0.002)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .mission(activeMission)
                .build();

        inactiveSatellite = Satellite.builder()
                .id(11L)
                .name("InactiveSat")
                .status(SatelliteStatus.INACTIF)
                .massKg(900.0)
                .altitudeKm(420.0)
                .inclinationDeg(52.0)
                .eccentricity(0.002)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .mission(activeMission)
                .build();

        satelliteOnClosedMission = Satellite.builder()
                .id(12L)
                .name("ClosedMissionSat")
                .status(SatelliteStatus.ACTIF)
                .massKg(900.0)
                .altitudeKm(420.0)
                .inclinationDeg(52.0)
                .eccentricity(0.002)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .mission(closedMission)
                .build();
    }

    @Test
    void shouldLaunchOrbitSimulationForActiveSatellite() {
        OrbitSimulationResult result = new OrbitSimulationResult(
                92.94,
                7.66,
                "ELLIPTIQUE",
                "[{\"x\":1.0000,\"y\":0.0000}]"
        );

        when(satelliteRepository.findById(10L)).thenReturn(Optional.of(activeSatellite));
        when(orbitSimulationService.simulate(420.0, 52.0, 0.002)).thenReturn(result);
        when(simulationRunRepository.save(any(SimulationRun.class))).thenAnswer(invocation -> {
            SimulationRun run = invocation.getArgument(0);
            run.setId(100L);
            return run;
        });

        SimulationResponse response = simulationService.launchOrbitSimulation(
                10L,
                "admin@finalspace.com"
        );

        assertEquals(100L, response.id());
        assertEquals(1L, response.missionId());
        assertEquals("Mission Artemis", response.missionName());
        assertEquals(10L, response.satelliteId());
        assertEquals("LunaSat-01", response.satelliteName());
        assertEquals(SimulationType.ORBIT, response.type());
        assertEquals(SimulationStatus.SUCCESS, response.status());
        assertEquals(900.0, response.inputMassKg());
        assertEquals(420.0, response.inputAltitudeKm());
        assertEquals(52.0, response.inputInclinationDeg());
        assertEquals(0.002, response.inputEccentricity());
        assertEquals(92.94, response.orbitalPeriodMinutes());
        assertEquals(7.66, response.averageVelocityKmS());
        assertEquals("ELLIPTIQUE", response.orbitShape());
        assertEquals("admin@finalspace.com", response.createdBy());
        assertNotNull(response.createdAt());

        verify(simulationRunRepository).save(any(SimulationRun.class));
    }

    @Test
    void shouldRejectLaunchWhenSatelliteDoesNotExist() {
        when(satelliteRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> simulationService.launchOrbitSimulation(999L, "admin@finalspace.com")
        );

        assertEquals("Satellite introuvable", exception.getMessage());

        verify(simulationRunRepository, never()).save(any());
    }

    @Test
    void shouldRejectLaunchWhenSatelliteIsInactive() {
        when(satelliteRepository.findById(11L)).thenReturn(Optional.of(inactiveSatellite));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> simulationService.launchOrbitSimulation(11L, "admin@finalspace.com")
        );

        assertEquals("Impossible de lancer une simulation sur un satellite inactif", exception.getMessage());

        verify(simulationRunRepository, never()).save(any());
    }

    @Test
    void shouldRejectLaunchWhenMissionIsClosed() {
        when(satelliteRepository.findById(12L)).thenReturn(Optional.of(satelliteOnClosedMission));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> simulationService.launchOrbitSimulation(12L, "admin@finalspace.com")
        );

        assertEquals("Impossible de lancer une simulation sur une mission clôturée", exception.getMessage());

        verify(simulationRunRepository, never()).save(any());
    }

    @Test
    void shouldRejectLaunchWhenMassIsInvalid() {
        activeSatellite.setMassKg(0.0);

        when(satelliteRepository.findById(10L)).thenReturn(Optional.of(activeSatellite));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> simulationService.launchOrbitSimulation(10L, "admin@finalspace.com")
        );

        assertEquals("Masse du satellite invalide", exception.getMessage());

        verify(simulationRunRepository, never()).save(any());
    }

    @Test
    void shouldRejectLaunchWhenAltitudeIsInvalid() {
        activeSatellite.setAltitudeKm(0.0);

        when(satelliteRepository.findById(10L)).thenReturn(Optional.of(activeSatellite));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> simulationService.launchOrbitSimulation(10L, "admin@finalspace.com")
        );

        assertEquals("Altitude orbitale invalide", exception.getMessage());

        verify(simulationRunRepository, never()).save(any());
    }

    @Test
    void shouldRejectLaunchWhenInclinationIsInvalid() {
        activeSatellite.setInclinationDeg(200.0);

        when(satelliteRepository.findById(10L)).thenReturn(Optional.of(activeSatellite));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> simulationService.launchOrbitSimulation(10L, "admin@finalspace.com")
        );

        assertEquals("Inclinaison orbitale invalide", exception.getMessage());

        verify(simulationRunRepository, never()).save(any());
    }

    @Test
    void shouldRejectLaunchWhenEccentricityIsInvalid() {
        activeSatellite.setEccentricity(1.0);

        when(satelliteRepository.findById(10L)).thenReturn(Optional.of(activeSatellite));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> simulationService.launchOrbitSimulation(10L, "admin@finalspace.com")
        );

        assertEquals("Excentricité orbitale invalide", exception.getMessage());

        verify(simulationRunRepository, never()).save(any());
    }
}