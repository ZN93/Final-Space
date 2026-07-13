package com.finalspace.backend.user.dto;

import com.finalspace.backend.user.RoleType;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String email,
        RoleType role,
        boolean active,
        LocalDateTime createdAt
) {
}