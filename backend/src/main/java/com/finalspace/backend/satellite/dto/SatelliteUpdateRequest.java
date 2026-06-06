package com.finalspace.backend.satellite.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SatelliteUpdateRequest(

        @NotBlank(message = "Le nom du satellite est obligatoire")
        @Size(max = 150, message = "Le nom ne doit pas dépasser 150 caractères")
        String name,

        @DecimalMin(value = "0.0", inclusive = false, message = "La masse doit être supérieure à 0")
        Double massKg,

        @DecimalMin(value = "0.0", inclusive = false, message = "L'altitude doit être supérieure à 0")
        Double altitudeKm,

        Double inclinationDeg,

        @DecimalMin(value = "0.0", inclusive = true, message = "L'excentricité doit être supérieure ou égale à 0")
        Double eccentricity
) {
}