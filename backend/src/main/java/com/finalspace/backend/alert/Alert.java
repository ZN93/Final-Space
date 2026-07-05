package com.finalspace.backend.alert;

import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.satellite.Satellite;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.time.Instant;

@Entity
@Table(
        name = "alerts",
        indexes = {
                @Index(name = "idx_alert_mission", columnList = "mission_id"),
                @Index(name = "idx_alert_status", columnList = "status"),
                @Index(name = "idx_alert_created_at", columnList = "created_at"),
                @Index(name = "idx_alert_anomaly_id", columnList = "anomaly_id", unique = true)
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La mission est obligatoire")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "satellite_id")
    private Satellite satellite;

    @NotBlank(message = "La métrique est obligatoire")
    @Size(max = 100, message = "La métrique ne doit pas dépasser 100 caractères")
    @Column(nullable = false, length = 100)
    private String metric;

    @NotBlank(message = "Le type d'alerte est obligatoire")
    @Size(max = 100, message = "Le type ne doit pas dépasser 100 caractères")
    @Column(nullable = false, length = 100)
    private String type;

    @NotNull(message = "La gravité est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlertSeverity severity;

    @NotNull(message = "Le statut est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlertStatus status;

    @NotBlank(message = "Le message est obligatoire")
    @Size(max = 1000, message = "Le message ne doit pas dépasser 1000 caractères")
    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime ackAt;

    @Size(max = 150, message = "L'utilisateur d'acquittement ne doit pas dépasser 150 caractères")
    @Column(length = 150)
    private String ackBy;

    @Size(max = 100, message = "L'identifiant d'anomalie ne doit pas dépasser 100 caractères")
    @Column(name = "anomaly_id", length = 100, unique = true)
    private String anomalyId;

    @Column(name = "telemetry_value")
    private Double telemetryValue;

    @Column(name = "telemetry_timestamp")
    private Instant telemetryTimestamp;
}