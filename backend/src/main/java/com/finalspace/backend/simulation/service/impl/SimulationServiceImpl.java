package com.finalspace.backend.simulation.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
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
import com.finalspace.backend.simulation.dto.OrbitSimulationResult;
import com.finalspace.backend.simulation.dto.SimulationResponse;
import com.finalspace.backend.simulation.dto.HohmannTransferRequest;
import com.finalspace.backend.simulation.dto.HohmannTransferResult;
import com.finalspace.backend.simulation.service.HohmannTransferService;
import com.finalspace.backend.simulation.service.OrbitSimulationService;
import com.finalspace.backend.simulation.service.SimulationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SimulationServiceImpl implements SimulationService {

    private final SatelliteRepository satelliteRepository;
    private final SimulationRunRepository simulationRunRepository;
    private final OrbitSimulationService orbitSimulationService;

    private final HohmannTransferService hohmannTransferService;

    @Override
    @Transactional
    public SimulationResponse launchOrbitSimulation(Long satelliteId, String createdBy) {
        Satellite satellite = satelliteRepository.findById(satelliteId)
                .orElseThrow(() -> new ResourceNotFoundException("Satellite introuvable"));

        validateSatelliteForSimulation(satellite);

        OrbitSimulationResult result = orbitSimulationService.simulate(
                satellite.getAltitudeKm(),
                satellite.getInclinationDeg(),
                satellite.getEccentricity()
        );

        SimulationRun simulationRun = SimulationRun.builder()
                .mission(satellite.getMission())
                .satellite(satellite)
                .type(SimulationType.ORBIT)
                .status(SimulationStatus.SUCCESS)
                .inputMassKg(satellite.getMassKg())
                .inputAltitudeKm(satellite.getAltitudeKm())
                .inputInclinationDeg(satellite.getInclinationDeg())
                .inputEccentricity(satellite.getEccentricity())
                .orbitalPeriodMinutes(result.orbitalPeriodMinutes())
                .averageVelocityKmS(result.averageVelocityKmS())
                .orbitShape(result.orbitShape())
                .plotDataJson(result.plotDataJson())
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();

        SimulationRun savedRun = simulationRunRepository.save(simulationRun);

        return toResponse(savedRun);
    }

    private void validateSatelliteForSimulation(Satellite satellite) {
        if (satellite.getStatus() == SatelliteStatus.INACTIF) {
            throw new BusinessException("Impossible de lancer une simulation sur un satellite inactif");
        }

        if (satellite.getMission().getStatus() == MissionStatus.CLOTUREE) {
            throw new BusinessException("Impossible de lancer une simulation sur une mission clôturée");
        }

        if (satellite.getMassKg() == null || satellite.getMassKg() <= 0) {
            throw new BusinessException("Masse du satellite invalide");
        }

        if (satellite.getAltitudeKm() == null || satellite.getAltitudeKm() <= 0) {
            throw new BusinessException("Altitude orbitale invalide");
        }

        if (satellite.getInclinationDeg() == null || satellite.getInclinationDeg() < 0 || satellite.getInclinationDeg() > 180) {
            throw new BusinessException("Inclinaison orbitale invalide");
        }

        if (satellite.getEccentricity() == null || satellite.getEccentricity() < 0 || satellite.getEccentricity() >= 1) {
            throw new BusinessException("Excentricité orbitale invalide");
        }
    }

    @Override
    @Transactional
    public SimulationResponse launchHohmannTransfer(
            Long satelliteId,
            HohmannTransferRequest request,
            String createdBy
    ) {
        Satellite satellite = satelliteRepository.findById(satelliteId)
                .orElseThrow(() -> new ResourceNotFoundException("Satellite introuvable"));

        validateSatelliteForSimulation(satellite);

        HohmannTransferResult result = hohmannTransferService.simulate(
                satellite.getAltitudeKm(),
                request.altitudeTargetKm()
        );

        SimulationRun simulationRun = SimulationRun.builder()
                .mission(satellite.getMission())
                .satellite(satellite)
                .type(SimulationType.HOHMANN)
                .status(SimulationStatus.SUCCESS)
                .inputMassKg(satellite.getMassKg())
                .inputAltitudeKm(satellite.getAltitudeKm())
                .inputInclinationDeg(satellite.getInclinationDeg())
                .inputEccentricity(satellite.getEccentricity())
                .targetAltitudeKm(request.altitudeTargetKm())
                .deltaV1MS(result.deltaV1MS())
                .deltaV2MS(result.deltaV2MS())
                .deltaVTotalMS(result.deltaVTotalMS())
                .transferTimeMinutes(result.transferTimeMinutes())
                .plotDataJson(result.plotDataJson())
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();

        SimulationRun savedRun = simulationRunRepository.save(simulationRun);

        return toResponse(savedRun);
    }

    private SimulationResponse toResponse(SimulationRun run) {
        return new SimulationResponse(
                run.getId(),
                run.getMission().getId(),
                run.getMission().getName(),
                run.getSatellite().getId(),
                run.getSatellite().getName(),
                run.getType(),
                run.getStatus(),
                run.getInputMassKg(),
                run.getInputAltitudeKm(),
                run.getInputInclinationDeg(),
                run.getInputEccentricity(),
                run.getOrbitalPeriodMinutes(),
                run.getAverageVelocityKmS(),
                run.getOrbitShape(),
                run.getTargetAltitudeKm(),
                run.getDeltaV1MS(),
                run.getDeltaV2MS(),
                run.getDeltaVTotalMS(),
                run.getTransferTimeMinutes(),
                run.getPlotDataJson(),
                run.getCreatedAt(),
                run.getCreatedBy()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<SimulationListItemResponse> findSimulationsBySatellite(Long satelliteId) {
        if (!satelliteRepository.existsById(satelliteId)) {
            throw new ResourceNotFoundException("Satellite introuvable");
        }

        return simulationRunRepository.findBySatelliteIdOrderByCreatedAtDesc(satelliteId)
                .stream()
                .map(this::toListItemResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SimulationDetailResponse findSimulationById(Long simulationId) {
        SimulationRun run = simulationRunRepository.findById(simulationId)
                .orElseThrow(() -> new ResourceNotFoundException("Simulation introuvable"));

        return toDetailResponse(run);
    }

    private SimulationListItemResponse toListItemResponse(SimulationRun run) {
        return new SimulationListItemResponse(
                run.getId(),
                run.getMission().getId(),
                run.getMission().getName(),
                run.getSatellite().getId(),
                run.getSatellite().getName(),
                run.getType(),
                run.getStatus(),
                run.getCreatedAt(),
                run.getCreatedBy(),
                run.getInputAltitudeKm(),
                run.getTargetAltitudeKm(),
                run.getOrbitalPeriodMinutes(),
                run.getAverageVelocityKmS(),
                run.getOrbitShape(),
                run.getDeltaVTotalMS(),
                run.getTransferTimeMinutes()
        );
    }

    private SimulationDetailResponse toDetailResponse(SimulationRun run) {
        return new SimulationDetailResponse(
                run.getId(),
                run.getMission().getId(),
                run.getMission().getName(),
                run.getSatellite().getId(),
                run.getSatellite().getName(),
                run.getType(),
                run.getStatus(),
                run.getInputMassKg(),
                run.getInputAltitudeKm(),
                run.getInputInclinationDeg(),
                run.getInputEccentricity(),
                run.getOrbitalPeriodMinutes(),
                run.getAverageVelocityKmS(),
                run.getOrbitShape(),
                run.getTargetAltitudeKm(),
                run.getDeltaV1MS(),
                run.getDeltaV2MS(),
                run.getDeltaVTotalMS(),
                run.getTransferTimeMinutes(),
                run.getPlotDataJson(),
                run.getCreatedAt(),
                run.getCreatedBy()
        );
    }
}