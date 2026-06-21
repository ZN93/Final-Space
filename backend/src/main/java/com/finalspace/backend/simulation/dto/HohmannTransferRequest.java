package com.finalspace.backend.simulation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record HohmannTransferRequest(
        @NotNull(message = "L'altitude cible est obligatoire")
        @DecimalMin(value = "0.0", inclusive = false, message = "L'altitude cible doit être supérieure à 0")
        Double altitudeTargetKm
) {
}