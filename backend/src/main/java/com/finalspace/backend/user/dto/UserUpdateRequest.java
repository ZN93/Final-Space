package com.finalspace.backend.user.dto;

import com.finalspace.backend.user.RoleType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserUpdateRequest(

        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "L'email doit être valide")
        String email,

        @NotNull(message = "Le rôle est obligatoire")
        RoleType role
) {
}