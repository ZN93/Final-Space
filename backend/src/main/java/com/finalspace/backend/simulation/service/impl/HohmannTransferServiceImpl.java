package com.finalspace.backend.simulation.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.simulation.dto.HohmannTransferResult;
import com.finalspace.backend.simulation.service.HohmannTransferService;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class HohmannTransferServiceImpl implements HohmannTransferService {

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double EARTH_GRAVITATIONAL_PARAMETER_KM3_S2 = 398600.4418;

    @Override
    public HohmannTransferResult simulate(
            Double initialAltitudeKm,
            Double targetAltitudeKm
    ) {
        validateInputs(initialAltitudeKm, targetAltitudeKm);

        double r1 = EARTH_RADIUS_KM + initialAltitudeKm;
        double r2 = EARTH_RADIUS_KM + targetAltitudeKm;

        double transferSemiMajorAxis = (r1 + r2) / 2.0;

        double circularVelocityInitial = Math.sqrt(EARTH_GRAVITATIONAL_PARAMETER_KM3_S2 / r1);
        double circularVelocityTarget = Math.sqrt(EARTH_GRAVITATIONAL_PARAMETER_KM3_S2 / r2);

        double transferVelocityAtPerigee = Math.sqrt(
                EARTH_GRAVITATIONAL_PARAMETER_KM3_S2 * ((2.0 / r1) - (1.0 / transferSemiMajorAxis))
        );

        double transferVelocityAtApogee = Math.sqrt(
                EARTH_GRAVITATIONAL_PARAMETER_KM3_S2 * ((2.0 / r2) - (1.0 / transferSemiMajorAxis))
        );

        double deltaV1KmS = Math.abs(transferVelocityAtPerigee - circularVelocityInitial);
        double deltaV2KmS = Math.abs(circularVelocityTarget - transferVelocityAtApogee);

        double deltaV1MS = deltaV1KmS * 1000.0;
        double deltaV2MS = deltaV2KmS * 1000.0;
        double deltaVTotalMS = deltaV1MS + deltaV2MS;

        double transferTimeSeconds = Math.PI * Math.sqrt(
                Math.pow(transferSemiMajorAxis, 3) / EARTH_GRAVITATIONAL_PARAMETER_KM3_S2
        );

        double transferTimeMinutes = transferTimeSeconds / 60.0;

        String plotDataJson = buildHohmannPlotData(r1, r2);

        return new HohmannTransferResult(
                round(deltaV1MS),
                round(deltaV2MS),
                round(deltaVTotalMS),
                round(transferTimeMinutes),
                plotDataJson
        );
    }

    private void validateInputs(Double initialAltitudeKm, Double targetAltitudeKm) {
        if (initialAltitudeKm == null || initialAltitudeKm <= 0) {
            throw new BusinessException("Altitude initiale invalide");
        }

        if (targetAltitudeKm == null || targetAltitudeKm <= 0) {
            throw new BusinessException("Altitude cible invalide");
        }

        if (initialAltitudeKm.equals(targetAltitudeKm)) {
            throw new BusinessException("L'altitude cible doit être différente de l'altitude initiale");
        }
    }

    private String buildHohmannPlotData(double r1, double r2) {
        double maxRadius = Math.max(r1, r2);

        double initialRadius = r1 / maxRadius;
        double targetRadius = r2 / maxRadius;

        double transferSemiMajorAxis = (initialRadius + targetRadius) / 2.0;
        double transferCenterOffset = (targetRadius - initialRadius) / 2.0;

        StringBuilder builder = new StringBuilder();
        builder.append("{");
        builder.append("\"initialOrbit\":").append(buildCirclePoints(initialRadius)).append(",");
        builder.append("\"targetOrbit\":").append(buildCirclePoints(targetRadius)).append(",");
        builder.append("\"transferArc\":").append(buildTransferArcPoints(transferSemiMajorAxis, initialRadius, transferCenterOffset));
        builder.append("}");

        return builder.toString();
    }

    private String buildCirclePoints(double radius) {
        StringBuilder builder = new StringBuilder();
        builder.append("[");

        for (int i = 0; i <= 72; i++) {
            double angle = 2 * Math.PI * i / 72;
            double x = radius * Math.cos(angle);
            double y = radius * Math.sin(angle);

            if (i > 0) {
                builder.append(",");
            }

            builder.append(String.format(Locale.US, "{\"x\":%.4f,\"y\":%.4f}", x, y));
        }

        builder.append("]");
        return builder.toString();
    }

    private String buildTransferArcPoints(
            double semiMajorAxis,
            double initialRadius,
            double centerOffset
    ) {
        double semiMinorAxis = Math.sqrt(semiMajorAxis * initialRadius);

        StringBuilder builder = new StringBuilder();
        builder.append("[");

        for (int i = 0; i <= 36; i++) {
            double angle = Math.PI * i / 36;

            double x = centerOffset + semiMajorAxis * Math.cos(angle);
            double y = semiMinorAxis * Math.sin(angle);

            if (i > 0) {
                builder.append(",");
            }

            builder.append(String.format(Locale.US, "{\"x\":%.4f,\"y\":%.4f}", x, y));
        }

        builder.append("]");
        return builder.toString();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}