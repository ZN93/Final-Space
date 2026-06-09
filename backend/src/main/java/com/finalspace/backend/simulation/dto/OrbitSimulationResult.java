package com.finalspace.backend.simulation.dto;

public record OrbitSimulationResult(
        Double orbitalPeriodMinutes,
        Double averageVelocityKmS,
        String orbitShape,
        String plotDataJson
) {
}