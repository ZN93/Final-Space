package com.finalspace.backend.incident;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.satellite.Satellite;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "incidents",
        indexes = {
                @Index(name = "idx_incident_mission", columnList = "mission_id"),
                @Index(name = "idx_incident_status", columnList = "status"),
                @Index(name = "idx_incident_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id")
    private Alert alert;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 150, message = "Le titre ne doit pas dépasser 150 caractères")
    @Column(nullable = false, length = 150)
    private String title;

    @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String description;

    @Size(max = 2000, message = "Les notes ne doivent pas dépasser 2000 caractères")
    @Column(length = 2000)
    private String notes;

    @NotNull(message = "La gravité est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentSeverity severity;

    @NotNull(message = "Le statut est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime closedAt;

    @NotBlank(message = "L'auteur est obligatoire")
    @Size(max = 150, message = "L'auteur ne doit pas dépasser 150 caractères")
    @Column(nullable = false, length = 150)
    private String createdBy;
}