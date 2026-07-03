package com.finalspace.backend.telemetry.anomaly;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "telemetry_anomalies")
@CompoundIndex(
        name = "idx_anomaly_dedup",
        def = "{'satelliteId': 1, 'metric': 1, 'timestamp': 1, 'type': 1, 'ruleName': 1}",
        unique = true
)
@CompoundIndex(
        name = "idx_anomaly_satellite_timestamp",
        def = "{'satelliteId': 1, 'timestamp': 1}"
)
public class TelemetryAnomaly {

    @Id
    private String id;

    private Long missionId;

    private Long satelliteId;

    private String metric;

    private TelemetryAnomalyType type;

    private TelemetryAnomalySeverity severity;

    private Instant timestamp;

    private Double value;

    private Double previousValue;

    private Instant previousTimestamp;

    private String ruleName;

    private Double thresholdUsed;

    private String message;

    private LocalDateTime createdAt;
}