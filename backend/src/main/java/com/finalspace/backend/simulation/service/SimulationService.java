package com.finalspace.backend.simulation.service;

import com.finalspace.backend.simulation.dto.SimulationResponse;
import com.finalspace.backend.simulation.dto.HohmannTransferRequest;
import com.finalspace.backend.simulation.dto.SimulationDetailResponse;
import com.finalspace.backend.simulation.dto.SimulationListItemResponse;

import java.util.List;

public interface SimulationService {

    SimulationResponse launchOrbitSimulation(Long satelliteId, String createdBy);

    SimulationResponse launchHohmannTransfer(Long satelliteId, HohmannTransferRequest request, String createdBy);

    List<SimulationListItemResponse> findSimulationsBySatellite(Long satelliteId);

    SimulationDetailResponse findSimulationById(Long simulationId);
}