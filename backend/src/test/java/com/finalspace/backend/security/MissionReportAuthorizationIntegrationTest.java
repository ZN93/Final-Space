package com.finalspace.backend.security;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.alert.AlertSeverity;
import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.incident.Incident;
import com.finalspace.backend.incident.IncidentRepository;
import com.finalspace.backend.incident.IncidentSeverity;
import com.finalspace.backend.incident.IncidentStatus;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.simulation.SimulationRun;
import com.finalspace.backend.simulation.SimulationRunRepository;
import com.finalspace.backend.simulation.SimulationStatus;
import com.finalspace.backend.simulation.SimulationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.security.test.context.support.WithMockUser;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import org.junit.jupiter.api.AfterEach;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MissionReportAuthorizationIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@finalspace.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private SatelliteRepository satelliteRepository;

    @Autowired
    private SimulationRunRepository simulationRunRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @BeforeEach
    @AfterEach
    void cleanDatabase() {
        incidentRepository.deleteAll();
        alertRepository.deleteAll();
        simulationRunRepository.deleteAll();
        satelliteRepository.deleteAll();
        missionRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = "admin@finalspace.com", roles = "ADMIN")
    void shouldGenerateMissionReportPdfAsAdmin() throws Exception {
        Mission mission = createMissionWithReportData();

        MvcResult result = mockMvc.perform(get("/api/missions/{missionId}/report/pdf", mission.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PDF))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("mission-report-" + mission.getId() + ".pdf")
                ))
                .andReturn();

        byte[] pdf = result.getResponse().getContentAsByteArray();

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    @WithMockUser(username = "lecteur@finalspace.com", roles = "LECTEUR")
    void shouldGenerateMissionReportPdfAsLecteur() throws Exception {
        Mission mission = createMissionWithReportData();

        MvcResult result = mockMvc.perform(get("/api/missions/{missionId}/report/pdf", mission.getId()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PDF))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("mission-report-" + mission.getId() + ".pdf")
                ))
                .andReturn();

        byte[] pdf = result.getResponse().getContentAsByteArray();

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    @WithMockUser(username = "admin@finalspace.com", roles = "ADMIN")
    void shouldReturnNotFoundWhenMissionDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/missions/{missionId}/report/pdf", 999999L))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectUnauthenticatedUser() throws Exception {
        Mission mission = createMissionWithReportData();

        mockMvc.perform(get("/api/missions/{missionId}/report/pdf", mission.getId()))
                .andExpect(status().isUnauthorized());
    }


    private Mission createMissionWithReportData() {
        Mission mission = missionRepository.save(
                Mission.builder()
                        .name("Mission Rapport US20")
                        .description("Mission utilisée pour valider le rapport PDF de mission.")
                        .status(MissionStatus.ACTIVE)
                        .createdAt(LocalDateTime.now().minusDays(10))
                        .build()
        );

        Satellite activeSatellite = satelliteRepository.save(
                Satellite.builder()
                        .mission(mission)
                        .name("US20-SAT-ACTIF")
                        .status(SatelliteStatus.ACTIF)
                        .massKg(850.0)
                        .altitudeKm(500.0)
                        .inclinationDeg(95.0)
                        .eccentricity(0.4)
                        .createdAt(LocalDateTime.now().minusDays(9))
                        .updatedAt(LocalDateTime.now().minusDays(1))
                        .build()
        );

        Satellite inactiveSatellite = satelliteRepository.save(
                Satellite.builder()
                        .mission(mission)
                        .name("US20-SAT-INACTIF")
                        .status(SatelliteStatus.INACTIF)
                        .massKg(650.0)
                        .altitudeKm(420.0)
                        .inclinationDeg(75.0)
                        .eccentricity(0.2)
                        .createdAt(LocalDateTime.now().minusDays(8))
                        .updatedAt(LocalDateTime.now().minusDays(2))
                        .build()
        );

        simulationRunRepository.save(
                SimulationRun.builder()
                        .mission(mission)
                        .satellite(activeSatellite)
                        .type(SimulationType.ORBIT)
                        .status(SimulationStatus.SUCCESS)
                        .inputMassKg(850.0)
                        .inputAltitudeKm(500.0)
                        .inputInclinationDeg(95.0)
                        .inputEccentricity(0.4)
                        .orbitalPeriodMinutes(94.47)
                        .averageVelocityKmS(7.62)
                        .orbitShape("ELLIPTIQUE")
                        .plotDataJson("{}")
                        .createdAt(LocalDateTime.now().minusDays(2))
                        .createdBy(ADMIN_EMAIL)
                        .build()
        );

        simulationRunRepository.save(
                SimulationRun.builder()
                        .mission(mission)
                        .satellite(activeSatellite)
                        .type(SimulationType.HOHMANN)
                        .status(SimulationStatus.SUCCESS)
                        .inputMassKg(850.0)
                        .inputAltitudeKm(500.0)
                        .inputInclinationDeg(95.0)
                        .inputEccentricity(0.4)
                        .targetAltitudeKm(1200.0)
                        .deltaV1MS(123.4)
                        .deltaV2MS(121.8)
                        .deltaVTotalMS(245.2)
                        .transferTimeMinutes(52.7)
                        .plotDataJson("{}")
                        .createdAt(LocalDateTime.now().minusDays(1))
                        .createdBy(ADMIN_EMAIL)
                        .build()
        );

        alertRepository.save(
                Alert.builder()
                        .mission(mission)
                        .satellite(activeSatellite)
                        .metric("temperature")
                        .type("ANOMALY_THRESHOLD")
                        .severity(AlertSeverity.ELEVEE)
                        .status(AlertStatus.ACTIVE)
                        .message("Température critique détectée sur le satellite actif.")
                        .createdAt(LocalDateTime.now().minusHours(6))
                        .build()
        );

        alertRepository.save(
                Alert.builder()
                        .mission(mission)
                        .satellite(inactiveSatellite)
                        .metric("battery")
                        .type("ANOMALY_THRESHOLD")
                        .severity(AlertSeverity.MOYENNE)
                        .status(AlertStatus.ACQUITTEE)
                        .message("Batterie faible déjà acquittée.")
                        .createdAt(LocalDateTime.now().minusHours(12))
                        .ackAt(LocalDateTime.now().minusHours(10))
                        .ackBy(ADMIN_EMAIL)
                        .build()
        );

        incidentRepository.save(
                Incident.builder()
                        .mission(mission)
                        .satellite(activeSatellite)
                        .title("Incident température")
                        .description("Incident ouvert lié à une température trop élevée.")
                        .notes("Surveillance renforcée.")
                        .severity(IncidentSeverity.ELEVEE)
                        .status(IncidentStatus.OUVERT)
                        .createdAt(LocalDateTime.now().minusHours(5))
                        .updatedAt(LocalDateTime.now().minusHours(4))
                        .createdBy(ADMIN_EMAIL)
                        .build()
        );

        incidentRepository.save(
                Incident.builder()
                        .mission(mission)
                        .satellite(inactiveSatellite)
                        .title("Incident batterie clôturé")
                        .description("Incident clôturé après analyse.")
                        .notes("Aucune action supplémentaire.")
                        .severity(IncidentSeverity.MOYENNE)
                        .status(IncidentStatus.CLOTURE)
                        .createdAt(LocalDateTime.now().minusDays(3))
                        .updatedAt(LocalDateTime.now().minusDays(2))
                        .closedAt(LocalDateTime.now().minusDays(2))
                        .createdBy(ADMIN_EMAIL)
                        .build()
        );

        return mission;
    }
}