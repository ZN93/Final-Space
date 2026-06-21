package com.finalspace.backend.simulation;

import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.satellite.Satellite;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "simulation_runs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "satellite_id", nullable = false)
    private Satellite satellite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SimulationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SimulationStatus status;

    @Column(nullable = false)
    private Double inputMassKg;

    @Column(nullable = false)
    private Double inputAltitudeKm;

    @Column(nullable = false)
    private Double inputInclinationDeg;

    @Column(nullable = false)
    private Double inputEccentricity;

    @Column(nullable = true)
    private Double orbitalPeriodMinutes;

    @Column(nullable = true)
    private Double averageVelocityKmS;

    @Column(nullable = true)
    private String orbitShape;

    @Column(nullable = true)
    private Double targetAltitudeKm;

    @Column(nullable = true)
    private Double deltaV1MS;

    @Column(nullable = true)
    private Double deltaV2MS;

    @Column(nullable = true)
    private Double deltaVTotalMS;

    @Column(nullable = true)
    private Double transferTimeMinutes;

    @Lob
    @Column(nullable = false)
    private String plotDataJson;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false, length = 150)
    private String createdBy;
}