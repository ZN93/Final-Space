package com.finalspace.backend.user.dto;

import jakarta.validation.constraints.NotNull;

public record UserStatusRequest(

        @NotNull(message = "Le statut actif est obligatoire")
        Boolean active
) {
}