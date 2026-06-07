package com.finalspace.backend.security;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.alert.AlertSeverity;
import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AlertAcknowledgementAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private SatelliteRepository satelliteRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Test
    void shouldAllowAdminToAcknowledgeActiveAlert() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Alert alert = createActiveAlert();

        MvcResult result = mockMvc.perform(post("/api/alerts/" + alert.getId() + "/ack")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = jsonMapper.readTree(result.getResponse().getContentAsString());

        assertEquals("ACQUITTEE", response.get("status").asText());
        assertFalse(response.get("ackAt").isNull());
        assertEquals("admin@finalspace.com", response.get("ackBy").asText());
    }

    @Test
    void shouldAllowOperatorToAcknowledgeActiveAlert() throws Exception {
        String operatorToken = loginAndGetToken("operator@finalspace.com", "operator123");
        Alert alert = createActiveAlert();

        MvcResult result = mockMvc.perform(post("/api/alerts/" + alert.getId() + "/ack")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = jsonMapper.readTree(result.getResponse().getContentAsString());

        assertEquals("ACQUITTEE", response.get("status").asText());
        assertFalse(response.get("ackAt").isNull());
        assertEquals("operator@finalspace.com", response.get("ackBy").asText());
    }

    @Test
    void shouldRejectReaderWhenAcknowledgingAlert() throws Exception {
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");
        Alert alert = createActiveAlert();

        mockMvc.perform(post("/api/alerts/" + alert.getId() + "/ack")
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectAcknowledgementWithoutToken() throws Exception {
        Alert alert = createActiveAlert();

        mockMvc.perform(post("/api/alerts/" + alert.getId() + "/ack"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnNotFoundWhenAlertDoesNotExist() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");

        mockMvc.perform(post("/api/alerts/99999/ack")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectAlreadyAcknowledgedAlert() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Alert alert = createAcknowledgedAlert();

        mockMvc.perform(post("/api/alerts/" + alert.getId() + "/ack")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();

        return jsonMapper.readTree(result.getResponse().getContentAsString())
                .get("token")
                .asText();
    }

    private Mission createMission() {
        Mission mission = Mission.builder()
                .name("Mission Ack Alert Test")
                .description("Mission utilisée pour tester l'acquittement des alertes")
                .status(com.finalspace.backend.mission.MissionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .closedAt(null)
                .build();

        return missionRepository.save(mission);
    }

    private Satellite createSatellite(Mission mission) {
        Satellite satellite = Satellite.builder()
                .name("AckSat-01")
                .status(SatelliteStatus.ACTIF)
                .massKg(850.0)
                .altitudeKm(400.0)
                .inclinationDeg(51.6)
                .eccentricity(0.001)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .mission(mission)
                .build();

        return satelliteRepository.save(satellite);
    }

    private Alert createActiveAlert() {
        Mission mission = createMission();
        Satellite satellite = createSatellite(mission);

        Alert alert = Alert.builder()
                .mission(mission)
                .satellite(satellite)
                .metric("temperature")
                .type("THERMAL_ANOMALY")
                .severity(AlertSeverity.ELEVEE)
                .status(AlertStatus.ACTIVE)
                .message("Température satellite supérieure au seuil")
                .createdAt(LocalDateTime.now())
                .ackAt(null)
                .ackBy(null)
                .build();

        return alertRepository.save(alert);
    }

    private Alert createAcknowledgedAlert() {
        Mission mission = createMission();
        Satellite satellite = createSatellite(mission);

        Alert alert = Alert.builder()
                .mission(mission)
                .satellite(satellite)
                .metric("battery")
                .type("BATTERY_WARNING")
                .severity(AlertSeverity.MOYENNE)
                .status(AlertStatus.ACQUITTEE)
                .message("Alerte batterie déjà acquittée")
                .createdAt(LocalDateTime.now().minusHours(1))
                .ackAt(LocalDateTime.now())
                .ackBy("admin@finalspace.com")
                .build();

        return alertRepository.save(alert);
    }
}