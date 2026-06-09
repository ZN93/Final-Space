package com.finalspace.backend.simulation.service;

import com.finalspace.backend.simulation.dto.SimulationResponse;

public interface SimulationService {

    SimulationResponse launchOrbitSimulation(Long satelliteId, String createdBy);
}