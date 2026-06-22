package com.finalspace.backend.security;

import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.telemetry.TelemetryPoint;
import com.finalspace.backend.telemetry.TelemetryPointRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TelemetryQueryAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private SatelliteRepository satelliteRepository;

    @Autowired
    private TelemetryPointRepository telemetryPointRepository;

    private final JsonMapper jsonMapper = new JsonMapper();

    @BeforeEach
    void cleanDatabase() {
        telemetryPointRepository.deleteAll();
        satelliteRepository.deleteAll();
        missionRepository.deleteAll();
    }

    @Test
    void adminShouldReadTelemetryMetrics() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createSatelliteWithTelemetry();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/metrics", satellite.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0]").value("battery"))
                .andExpect(jsonPath("$[1]").value("temperature"));
    }

    @Test
    void operatorShouldReadTelemetry() throws Exception {
        String token = loginAndGetToken("operator@finalspace.com", "operator123");
        Satellite satellite = createSatelliteWithTelemetry();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry", satellite.getId())
                        .param("metric", "temperature")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.satelliteId").value(satellite.getId()))
                .andExpect(jsonPath("$.metrics[0]").value("temperature"))
                .andExpect(jsonPath("$.count").value(3))
                .andExpect(jsonPath("$.points[0].metric").value("temperature"))
                .andExpect(jsonPath("$.points[0].value").value(40.0))
                .andExpect(jsonPath("$.points[1].value").value(42.5))
                .andExpect(jsonPath("$.points[2].value").value(45.0));
    }

    @Test
    void readerShouldReadTelemetry() throws Exception {
        String token = loginAndGetToken("reader@finalspace.com", "reader123");
        Satellite satellite = createSatelliteWithTelemetry();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry", satellite.getId())
                        .param("metric", "battery")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.satelliteId").value(satellite.getId()))
                .andExpect(jsonPath("$.metrics[0]").value("battery"))
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.points[0].metric").value("battery"))
                .andExpect(jsonPath("$.points[1].metric").value("battery"));
    }

    @Test
    void unauthenticatedUserShouldNotReadTelemetry() throws Exception {
        Satellite satellite = createSatelliteWithTelemetry();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry", satellite.getId())
                        .param("metric", "temperature"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectTelemetryQueryWithoutMetric() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createSatelliteWithTelemetry();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry", satellite.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldFilterTelemetryByPeriod() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createSatelliteWithTelemetry();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry", satellite.getId())
                        .param("metric", "temperature")
                        .param("from", "2026-01-01T10:05:00Z")
                        .param("to", "2026-01-01T10:10:00Z")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.points[0].value").value(42.5))
                .andExpect(jsonPath("$.points[1].value").value(45.0));
    }

    @Test
    void shouldReadMultipleMetrics() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createSatelliteWithTelemetry();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry", satellite.getId())
                        .param("metric", "temperature")
                        .param("metric", "battery")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(5))
                .andExpect(jsonPath("$.metrics[0]").value("temperature"))
                .andExpect(jsonPath("$.metrics[1]").value("battery"));
    }

    @Test
    void shouldApplyLimit() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createSatelliteWithTelemetry();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry", satellite.getId())
                        .param("metric", "temperature")
                        .param("limit", "2")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.points.length()").value(2));
    }

    @Test
    void shouldRejectInvalidPeriod() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createSatelliteWithTelemetry();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry", satellite.getId())
                        .param("metric", "temperature")
                        .param("from", "2026-01-02T00:00:00Z")
                        .param("to", "2026-01-01T00:00:00Z")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectUnknownSatellite() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry", 99999L)
                        .param("metric", "temperature")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        String request = """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, password);

        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode responseJson = jsonMapper.readTree(response);

        return responseJson.get("token").asString();
    }

    private Satellite createSatelliteWithTelemetry() {
        Mission mission = Mission.builder()
                .name("Mission Telemetry Charts")
                .description("Mission utilisée pour les tests de visualisation télémétrie")
                .status(MissionStatus.CLOTUREE)
                .createdAt(LocalDateTime.now())
                .build();

        Mission savedMission = missionRepository.save(mission);

        Satellite satellite = Satellite.builder()
                .name("TelemetryChartSat")
                .status(SatelliteStatus.INACTIF)
                .massKg(850.0)
                .altitudeKm(500.0)
                .inclinationDeg(95.0)
                .eccentricity(0.4)
                .mission(savedMission)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Satellite savedSatellite = satelliteRepository.save(satellite);

        String importId = UUID.randomUUID().toString();

        telemetryPointRepository.saveAll(List.of(
                createPoint(savedMission.getId(), savedSatellite.getId(), "2026-01-01T10:00:00Z", "temperature", 40.0, importId),
                createPoint(savedMission.getId(), savedSatellite.getId(), "2026-01-01T10:05:00Z", "temperature", 42.5, importId),
                createPoint(savedMission.getId(), savedSatellite.getId(), "2026-01-01T10:10:00Z", "temperature", 45.0, importId),
                createPoint(savedMission.getId(), savedSatellite.getId(), "2026-01-01T10:00:00Z", "battery", 80.0, importId),
                createPoint(savedMission.getId(), savedSatellite.getId(), "2026-01-01T10:10:00Z", "battery", 76.0, importId)
        ));

        return savedSatellite;
    }

    private TelemetryPoint createPoint(
            Long missionId,
            Long satelliteId,
            String timestamp,
            String metric,
            Double value,
            String importId
    ) {
        return TelemetryPoint.builder()
                .missionId(missionId)
                .satelliteId(satelliteId)
                .timestamp(Instant.parse(timestamp))
                .metric(metric)
                .value(value)
                .sourceImportId(importId)
                .createdAt(LocalDateTime.now())
                .build();
    }
}