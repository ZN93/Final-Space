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
import com.finalspace.backend.simulation.dto.HohmannTransferRequest;
import com.finalspace.backend.simulation.dto.HohmannTransferResult;
import com.finalspace.backend.simulation.dto.SimulationResponse;
import com.finalspace.backend.simulation.service.HohmannTransferService;
import com.finalspace.backend.simulation.service.OrbitSimulationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SimulationServiceImplHohmannTest {

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
    void shouldLaunchHohmannTransferForActiveSatellite() {
        Satellite satellite = activeSatellite();

        HohmannTransferResult hohmannResult = new HohmannTransferResult(
                80.93,
                80.07,
                161.0,
                48.79,
                "{\"initialOrbit\":[],\"targetOrbit\":[],\"transferArc\":[]}"
        );

        when(satelliteRepository.findById(3L)).thenReturn(Optional.of(satellite));
        when(hohmannTransferService.simulate(500.0, 800.0)).thenReturn(hohmannResult);
        when(simulationRunRepository.save(any(SimulationRun.class)))
                .thenAnswer(invocation -> {
                    SimulationRun run = invocation.getArgument(0);
                    run.setId(21L);
                    return run;
                });

        SimulationResponse response = simulationService.launchHohmannTransfer(
                3L,
                new HohmannTransferRequest(800.0),
                "admin@finalspace.com"
        );

        assertThat(response.id()).isEqualTo(21L);
        assertThat(response.type()).isEqualTo(SimulationType.HOHMANN);
        assertThat(response.status()).isEqualTo(SimulationStatus.SUCCESS);
        assertThat(response.satelliteId()).isEqualTo(3L);
        assertThat(response.missionId()).isEqualTo(4L);
        assertThat(response.inputMassKg()).isEqualTo(850.0);
        assertThat(response.inputAltitudeKm()).isEqualTo(500.0);
        assertThat(response.inputInclinationDeg()).isEqualTo(95.0);
        assertThat(response.inputEccentricity()).isEqualTo(0.4);
        assertThat(response.targetAltitudeKm()).isEqualTo(800.0);
        assertThat(response.deltaV1MS()).isEqualTo(80.93);
        assertThat(response.deltaV2MS()).isEqualTo(80.07);
        assertThat(response.deltaVTotalMS()).isEqualTo(161.0);
        assertThat(response.transferTimeMinutes()).isEqualTo(48.79);
        assertThat(response.createdBy()).isEqualTo("admin@finalspace.com");

        ArgumentCaptor<SimulationRun> captor = ArgumentCaptor.forClass(SimulationRun.class);
        verify(simulationRunRepository).save(captor.capture());

        SimulationRun savedRun = captor.getValue();

        assertThat(savedRun.getType()).isEqualTo(SimulationType.HOHMANN);
        assertThat(savedRun.getStatus()).isEqualTo(SimulationStatus.SUCCESS);
        assertThat(savedRun.getTargetAltitudeKm()).isEqualTo(800.0);
        assertThat(savedRun.getDeltaV1MS()).isEqualTo(80.93);
        assertThat(savedRun.getDeltaV2MS()).isEqualTo(80.07);
        assertThat(savedRun.getDeltaVTotalMS()).isEqualTo(161.0);
        assertThat(savedRun.getTransferTimeMinutes()).isEqualTo(48.79);
    }

    @Test
    void shouldRejectHohmannTransferWhenSatelliteDoesNotExist() {
        when(satelliteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> simulationService.launchHohmannTransfer(
                99L,
                new HohmannTransferRequest(800.0),
                "admin@finalspace.com"
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Satellite introuvable");

        verifyNoInteractions(hohmannTransferService);
        verify(simulationRunRepository, never()).save(any());
    }

    @Test
    void shouldRejectHohmannTransferWhenSatelliteIsInactive() {
        Satellite satellite = activeSatellite();
        satellite.setStatus(SatelliteStatus.INACTIF);

        when(satelliteRepository.findById(3L)).thenReturn(Optional.of(satellite));

        assertThatThrownBy(() -> simulationService.launchHohmannTransfer(
                3L,
                new HohmannTransferRequest(800.0),
                "admin@finalspace.com"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Impossible de lancer une simulation sur un satellite inactif");

        verifyNoInteractions(hohmannTransferService);
        verify(simulationRunRepository, never()).save(any());
    }

    @Test
    void shouldRejectHohmannTransferWhenMissionIsClosed() {
        Satellite satellite = activeSatellite();
        satellite.getMission().setStatus(MissionStatus.CLOTUREE);

        when(satelliteRepository.findById(3L)).thenReturn(Optional.of(satellite));

        assertThatThrownBy(() -> simulationService.launchHohmannTransfer(
                3L,
                new HohmannTransferRequest(800.0),
                "admin@finalspace.com"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Impossible de lancer une simulation sur une mission clôturée");

        verifyNoInteractions(hohmannTransferService);
        verify(simulationRunRepository, never()).save(any());
    }

    @Test
    void shouldDelegateInvalidTargetAltitudeToHohmannEngine() {
        Satellite satellite = activeSatellite();

        when(satelliteRepository.findById(3L)).thenReturn(Optional.of(satellite));
        when(hohmannTransferService.simulate(500.0, 500.0))
                .thenThrow(new BusinessException("L'altitude cible doit être différente de l'altitude initiale"));

        assertThatThrownBy(() -> simulationService.launchHohmannTransfer(
                3L,
                new HohmannTransferRequest(500.0),
                "admin@finalspace.com"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("L'altitude cible doit être différente de l'altitude initiale");

        verify(simulationRunRepository, never()).save(any());
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
}