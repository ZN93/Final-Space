package com.finalspace.backend.simulation.controller;

import com.finalspace.backend.simulation.dto.SimulationResponse;
import com.finalspace.backend.simulation.service.SimulationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class SimulationController {

    private final SimulationService simulationService;

    @PostMapping("/satellites/{id}/simulations/orbit")
    @ResponseStatus(HttpStatus.CREATED)
    public SimulationResponse launchOrbitSimulation(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return simulationService.launchOrbitSimulation(id, authentication.getName());
    }
}