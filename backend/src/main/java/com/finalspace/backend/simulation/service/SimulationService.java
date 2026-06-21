package com.finalspace.backend.simulation.service;

import com.finalspace.backend.simulation.dto.SimulationResponse;
import com.finalspace.backend.simulation.dto.HohmannTransferRequest;

public interface SimulationService {

    SimulationResponse launchOrbitSimulation(Long satelliteId, String createdBy);

    SimulationResponse launchHohmannTransfer(Long satelliteId, HohmannTransferRequest request, String createdBy);
}