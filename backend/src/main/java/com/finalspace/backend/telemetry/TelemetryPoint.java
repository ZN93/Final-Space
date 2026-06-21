package com.finalspace.backend.telemetry;

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
@Document(collection = "telemetry_points")
@CompoundIndex(
        name = "idx_satellite_metric_timestamp",
        def = "{'satelliteId': 1, 'metric': 1, 'timestamp': 1}"
)
public class TelemetryPoint {

    @Id
    private String id;

    private Long missionId;

    private Long satelliteId;

    private Instant timestamp;

    private String metric;

    private Double value;

    private String sourceImportId;

    private LocalDateTime createdAt;
}