package com.finalspace.backend.simulation.dto;

public record HohmannTransferResult(
        Double deltaV1MS,
        Double deltaV2MS,
        Double deltaVTotalMS,
        Double transferTimeMinutes,
        String plotDataJson
) {
}