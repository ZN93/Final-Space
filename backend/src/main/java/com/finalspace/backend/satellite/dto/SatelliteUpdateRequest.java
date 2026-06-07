package com.finalspace.backend.satellite.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SatelliteUpdateRequest(
        @NotBlank(message = "Le nom du satellite est obligatoire")
        @Size(max = 150, message = "Le nom ne doit pas dépasser 150 caractères")
        String name,

        @NotNull(message = "La masse est obligatoire")
        @DecimalMin(value = "0.0", inclusive = false, message = "La masse doit être supérieure à 0")
        Double massKg,

        @NotNull(message = "L'altitude est obligatoire")
        @DecimalMin(value = "0.0", inclusive = false, message = "L'altitude doit être supérieure à 0")
        Double altitudeKm,

        @NotNull(message = "L'inclinaison est obligatoire")
        @DecimalMin(value = "0.0", message = "L'inclinaison doit être supérieure ou égale à 0")
        @DecimalMax(value = "180.0", message = "L'inclinaison doit être inférieure ou égale à 180")
        Double inclinationDeg,

        @NotNull(message = "L'excentricité est obligatoire")
        @DecimalMin(value = "0.0", message = "L'excentricité doit être supérieure ou égale à 0")
        Double eccentricity
) {
}