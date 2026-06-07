package com.finalspace.backend.incident.dto;

import com.finalspace.backend.incident.IncidentSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record IncidentCreateRequest(
        Long satelliteId,
        Long alertId,

        @NotBlank(message = "Le titre est obligatoire")
        @Size(max = 150, message = "Le titre ne doit pas dépasser 150 caractères")
        String title,

        @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères")
        String description,

        @Size(max = 2000, message = "Les notes ne doivent pas dépasser 2000 caractères")
        String notes,

        @NotNull(message = "La gravité est obligatoire")
        IncidentSeverity severity
) {
}