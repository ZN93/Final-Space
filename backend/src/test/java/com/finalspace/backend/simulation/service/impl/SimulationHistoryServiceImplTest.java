package com.finalspace.backend.simulation.service.impl;

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
import com.finalspace.backend.simulation.dto.SimulationDetailResponse;
import com.finalspace.backend.simulation.dto.SimulationListItemResponse;
import com.finalspace.backend.simulation.service.HohmannTransferService;
import com.finalspace.backend.simulation.service.OrbitSimulationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SimulationHistoryServiceImplTest {

    @Mock
    private SatelliteRepository satelliteRepository;

    @Mock
    private SimulationRunRepository simulationRunRepository;

    @Mock
    private OrbitSimulationService orbitSimulationService;

    @Mock
    private HohmannTransferService hohmannTransferService;

    @InjectMocks
    private SimulationServiceImpl simulationService;

    @Test
    void shouldReturnSimulationHistoryForSatelliteOrderedByCreatedAtDesc() {
        Satellite satellite = activeSatellite();

        SimulationRun latestRun = hohmannRun(21L, satellite, LocalDateTime.now());
        SimulationRun olderRun = orbitRun(20L, satellite, LocalDateTime.now().minusHours(1));

        when(satelliteRepository.existsById(3L)).thenReturn(true);
        when(simulationRunRepository.findBySatelliteIdOrderByCreatedAtDesc(3L))
                .thenReturn(List.of(latestRun, olderRun));

        List<SimulationListItemResponse> result = simulationService.findSimulationsBySatellite(3L);

        assertThat(result).hasSize(2);

        assertThat(result.get(0).id()).isEqualTo(21L);
        assertThat(result.get(0).type()).isEqualTo(SimulationType.HOHMANN);
        assertThat(result.get(0).targetAltitudeKm()).isEqualTo(800.0);
        assertThat(result.get(0).deltaVTotalMS()).isEqualTo(161.0);
        assertThat(result.get(0).transferTimeMinutes()).isEqualTo(48.79);

        assertThat(result.get(1).id()).isEqualTo(20L);
        assertThat(result.get(1).type()).isEqualTo(SimulationType.ORBIT);
        assertThat(result.get(1).orbitalPeriodMinutes()).isEqualTo(94.47);
        assertThat(result.get(1).averageVelocityKmS()).isEqualTo(7.62);
        assertThat(result.get(1).orbitShape()).isEqualTo("ELLIPTIQUE");
    }

    @Test
    void shouldReturnEmptySimulationHistoryForSatelliteWithoutRuns() {
        when(satelliteRepository.existsById(3L)).thenReturn(true);
        when(simulationRunRepository.findBySatelliteIdOrderByCreatedAtDesc(3L))
                .thenReturn(List.of());

        List<SimulationListItemResponse> result = simulationService.findSimulationsBySatellite(3L);

        assertThat(result).isEmpty();
    }

    @Test
    void shouldRejectHistoryWhenSatelliteDoesNotExist() {
        when(satelliteRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> simulationService.findSimulationsBySatellite(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Satellite introuvable");

        verify(simulationRunRepository, never()).findBySatelliteIdOrderByCreatedAtDesc(99L);
    }

    @Test
    void shouldReturnSimulationDetail() {
        Satellite satellite = activeSatellite();
        SimulationRun run = hohmannRun(21L, satellite, LocalDateTime.now());

        when(simulationRunRepository.findById(21L)).thenReturn(Optional.of(run));

        SimulationDetailResponse response = simulationService.findSimulationById(21L);

        assertThat(response.id()).isEqualTo(21L);
        assertThat(response.type()).isEqualTo(SimulationType.HOHMANN);
        assertThat(response.status()).isEqualTo(SimulationStatus.SUCCESS);
        assertThat(response.missionId()).isEqualTo(4L);
        assertThat(response.satelliteId()).isEqualTo(3L);
        assertThat(response.inputMassKg()).isEqualTo(850.0);
        assertThat(response.inputAltitudeKm()).isEqualTo(500.0);
        assertThat(response.targetAltitudeKm()).isEqualTo(800.0);
        assertThat(response.deltaV1MS()).isEqualTo(80.93);
        assertThat(response.deltaV2MS()).isEqualTo(80.07);
        assertThat(response.deltaVTotalMS()).isEqualTo(161.0);
        assertThat(response.transferTimeMinutes()).isEqualTo(48.79);
        assertThat(response.plotDataJson()).contains("transferArc");
    }

    @Test
    void shouldRejectDetailWhenSimulationDoesNotExist() {
        when(simulationRunRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> simulationService.findSimulationById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Simulation introuvable");
    }

    private Satellite activeSatellite() {
        Mission mission = Mission.builder()
                .id(4L)
                .name("Mission to the MOOOOON")
                .status(MissionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        return Satellite.builder()
                .id(3L)
                .name("LunaSat-03")
                .status(SatelliteStatus.ACTIF)
                .massKg(850.0)
                .altitudeKm(500.0)
                .inclinationDeg(95.0)
                .eccentricity(0.4)
                .mission(mission)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private SimulationRun orbitRun(Long id, Satellite satellite, LocalDateTime createdAt) {
        return SimulationRun.builder()
                .id(id)
                .mission(satellite.getMission())
                .satellite(satellite)
                .type(SimulationType.ORBIT)
                .status(SimulationStatus.SUCCESS)
                .inputMassKg(850.0)
                .inputAltitudeKm(500.0)
                .inputInclinationDeg(95.0)
                .inputEccentricity(0.4)
                .orbitalPeriodMinutes(94.47)
                .averageVelocityKmS(7.62)
                .orbitShape("ELLIPTIQUE")
                .plotDataJson("[{\"x\":1,\"y\":0}]")
                .createdAt(createdAt)
                .createdBy("admin@finalspace.com")
                .build();
    }

    private SimulationRun hohmannRun(Long id, Satellite satellite, LocalDateTime createdAt) {
        return SimulationRun.builder()
                .id(id)
                .mission(satellite.getMission())
                .satellite(satellite)
                .type(SimulationType.HOHMANN)
                .status(SimulationStatus.SUCCESS)
                .inputMassKg(850.0)
                .inputAltitudeKm(500.0)
                .inputInclinationDeg(95.0)
                .inputEccentricity(0.4)
                .targetAltitudeKm(800.0)
                .deltaV1MS(80.93)
                .deltaV2MS(80.07)
                .deltaVTotalMS(161.0)
                .transferTimeMinutes(48.79)
                .plotDataJson("{\"initialOrbit\":[],\"targetOrbit\":[],\"transferArc\":[]}")
                .createdAt(createdAt)
                .createdBy("admin@finalspace.com")
                .build();
    }
}