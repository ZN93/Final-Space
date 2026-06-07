package com.finalspace.backend.incident.dto;

import com.finalspace.backend.incident.IncidentStatus;
import jakarta.validation.constraints.NotNull;

public record IncidentStatusUpdateRequest(
        @NotNull(message = "Le statut est obligatoire")
        IncidentStatus status
) {
}