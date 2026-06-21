package com.finalspace.backend.simulation.service;

import com.finalspace.backend.simulation.dto.HohmannTransferResult;

public interface HohmannTransferService {

    HohmannTransferResult simulate(
            Double initialAltitudeKm,
            Double targetAltitudeKm
    );
}