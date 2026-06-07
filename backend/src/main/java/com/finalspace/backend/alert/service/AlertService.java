package com.finalspace.backend.alert.service;

import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.alert.dto.AlertResponse;

import java.util.List;

public interface AlertService {

    List<AlertResponse> findByMission(Long missionId, AlertStatus status);

    AlertResponse acknowledge(Long alertId, String acknowledgedBy);
}