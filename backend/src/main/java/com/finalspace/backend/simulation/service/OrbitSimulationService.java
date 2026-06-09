package com.finalspace.backend.simulation.service;

import com.finalspace.backend.simulation.dto.OrbitSimulationResult;

public interface OrbitSimulationService {

    OrbitSimulationResult simulate(
            Double altitudeKm,
            Double inclinationDeg,
            Double eccentricity
    );
}