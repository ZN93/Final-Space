package com.finalspace.backend.alert.controller;

import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.alert.dto.AlertResponse;
import com.finalspace.backend.alert.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/missions/{missionId}/alerts")
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public List<AlertResponse> findByMission(
            @PathVariable Long missionId,
            @RequestParam(required = false) AlertStatus status
    ) {
        return alertService.findByMission(missionId, status);
    }
}