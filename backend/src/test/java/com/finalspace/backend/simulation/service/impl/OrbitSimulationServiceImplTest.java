package com.finalspace.backend.simulation.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.simulation.dto.OrbitSimulationResult;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OrbitSimulationServiceImplTest {

    private final OrbitSimulationServiceImpl orbitSimulationService = new OrbitSimulationServiceImpl();

    @Test
    void shouldComputeOrbitSimulationForValidCircularOrbit() {
        OrbitSimulationResult result = orbitSimulationService.simulate(
                400.0,
                51.6,
                0.0
        );

        assertNotNull(result);
        assertTrue(result.orbitalPeriodMinutes() > 0);
        assertTrue(result.averageVelocityKmS() > 0);
        assertEquals("CIRCULAIRE", result.orbitShape());
        assertNotNull(result.plotDataJson());
        assertTrue(result.plotDataJson().contains("\"x\""));
        assertTrue(result.plotDataJson().contains("\"y\""));
    }

    @Test
    void shouldComputeOrbitSimulationForValidEllipticOrbit() {
        OrbitSimulationResult result = orbitSimulationService.simulate(
                550.0,
                67.0,
                0.002
        );

        assertNotNull(result);
        assertTrue(result.orbitalPeriodMinutes() > 0);
        assertTrue(result.averageVelocityKmS() > 0);
        assertEquals("ELLIPTIQUE", result.orbitShape());
        assertNotNull(result.plotDataJson());
    }

    @Test
    void shouldRejectInvalidAltitude() {
        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> orbitSimulationService.simulate(0.0, 51.6, 0.001)
        );

        assertEquals("Altitude orbitale invalide", exception.getMessage());
    }

    @Test
    void shouldRejectInvalidInclination() {
        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> orbitSimulationService.simulate(400.0, 200.0, 0.001)
        );

        assertEquals("Inclinaison orbitale invalide", exception.getMessage());
    }

    @Test
    void shouldRejectNegativeEccentricity() {
        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> orbitSimulationService.simulate(400.0, 51.6, -0.1)
        );

        assertEquals("Excentricité orbitale invalide", exception.getMessage());
    }

    @Test
    void shouldRejectUnsupportedEccentricity() {
        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> orbitSimulationService.simulate(400.0, 51.6, 1.0)
        );

        assertEquals("Excentricité non supportée pour une orbite liée", exception.getMessage());
    }
}