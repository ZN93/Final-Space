package com.finalspace.backend.satellite;

import com.finalspace.backend.mission.Mission;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "satellites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Satellite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le nom du satellite est obligatoire")
    @Size(max = 150, message = "Le nom ne doit pas dépasser 150 caractères")
    @Column(nullable = false, length = 150)
    private String name;

    @NotNull(message = "Le statut du satellite est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SatelliteStatus status;

    @DecimalMin(value = "0.0", inclusive = false, message = "La masse doit être supérieure à 0")
    @Column(name = "mass_kg")
    private Double massKg;

    @DecimalMin(value = "0.0", inclusive = false, message = "L'altitude doit être supérieure à 0")
    @Column(name = "altitude_km")
    private Double altitudeKm;

    @Column(name = "inclination_deg")
    private Double inclinationDeg;

    @DecimalMin(value = "0.0", inclusive = true, message = "L'excentricité doit être supérieure ou égale à 0")
    private Double eccentricity;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;
}