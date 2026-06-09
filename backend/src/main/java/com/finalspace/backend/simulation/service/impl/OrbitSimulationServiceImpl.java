package com.finalspace.backend.simulation.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.simulation.dto.OrbitSimulationResult;
import com.finalspace.backend.simulation.service.OrbitSimulationService;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class OrbitSimulationServiceImpl implements OrbitSimulationService {

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double EARTH_GRAVITATIONAL_PARAMETER_KM3_S2 = 398600.4418;

    @Override
    public OrbitSimulationResult simulate(
            Double altitudeKm,
            Double inclinationDeg,
            Double eccentricity
    ) {
        validateInputs(altitudeKm, inclinationDeg, eccentricity);

        double orbitalRadiusKm = EARTH_RADIUS_KM + altitudeKm;

        double orbitalPeriodSeconds = 2 * Math.PI * Math.sqrt(
                Math.pow(orbitalRadiusKm, 3) / EARTH_GRAVITATIONAL_PARAMETER_KM3_S2
        );

        double orbitalPeriodMinutes = orbitalPeriodSeconds / 60.0;

        double averageVelocityKmS = Math.sqrt(
                EARTH_GRAVITATIONAL_PARAMETER_KM3_S2 / orbitalRadiusKm
        );

        String orbitShape = eccentricity == 0.0 ? "CIRCULAIRE" : "ELLIPTIQUE";

        String plotDataJson = buildSimpleOrbitPlotData(eccentricity);

        return new OrbitSimulationResult(
                round(orbitalPeriodMinutes),
                round(averageVelocityKmS),
                orbitShape,
                plotDataJson
        );
    }

    private void validateInputs(
            Double altitudeKm,
            Double inclinationDeg,
            Double eccentricity
    ) {
        if (altitudeKm == null || altitudeKm <= 0) {
            throw new BusinessException("Altitude orbitale invalide");
        }

        if (inclinationDeg == null || inclinationDeg < 0 || inclinationDeg > 180) {
            throw new BusinessException("Inclinaison orbitale invalide");
        }

        if (eccentricity == null || eccentricity < 0) {
            throw new BusinessException("Excentricité orbitale invalide");
        }

        if (eccentricity >= 1) {
            throw new BusinessException("Excentricité non supportée pour une orbite liée");
        }
    }

    private String buildSimpleOrbitPlotData(double eccentricity) {
        double semiMajorAxis = 1.0;
        double semiLatusRectum = semiMajorAxis * (1 - Math.pow(eccentricity, 2));

        StringBuilder builder = new StringBuilder();
        builder.append("[");

        for (int i = 0; i <= 72; i++) {
            double trueAnomaly = 2 * Math.PI * i / 72;

            double radius = semiLatusRectum / (1 + eccentricity * Math.cos(trueAnomaly));

            double x = radius * Math.cos(trueAnomaly);
            double y = radius * Math.sin(trueAnomaly);

            if (i > 0) {
                builder.append(",");
            }

            builder.append(String.format(
                    Locale.US,
                    "{\"x\":%.4f,\"y\":%.4f}",
                    x,
                    y
            ));
        }

        builder.append("]");
        return builder.toString();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}