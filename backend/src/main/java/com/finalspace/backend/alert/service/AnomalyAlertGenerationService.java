package com.finalspace.backend.alert.service;

import com.finalspace.backend.telemetry.anomaly.TelemetryAnomaly;

import java.util.List;

public interface AnomalyAlertGenerationService {

    void generateAlertsFromAnomalies(List<TelemetryAnomaly> anomalies);
}