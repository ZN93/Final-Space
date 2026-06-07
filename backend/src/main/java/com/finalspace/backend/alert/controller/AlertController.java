package com.finalspace.backend.alert.controller;

import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.alert.dto.AlertResponse;
import com.finalspace.backend.alert.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping("/api/missions/{missionId}/alerts")
    public List<AlertResponse> findByMission(
            @PathVariable Long missionId,
            @RequestParam(required = false) AlertStatus status
    ) {
        return alertService.findByMission(missionId, status);
    }

    @PostMapping("/api/alerts/{alertId}/ack")
    public AlertResponse acknowledge(
            @PathVariable Long alertId,
            Authentication authentication
    ) {
        return alertService.acknowledge(alertId, authentication.getName());
    }
}