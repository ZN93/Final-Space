package com.finalspace.backend.security;

import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.telemetry.TelemetryPointRepository;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TelemetryImportAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private SatelliteRepository satelliteRepository;

    @Autowired
    private TelemetryPointRepository telemetryPointRepository;

    @Autowired
    private TelemetryAnomalyRepository telemetryAnomalyRepository;

    @Autowired
    private AlertRepository alertRepository;

    private final JsonMapper jsonMapper = new JsonMapper();

    @BeforeEach
    void cleanDatabase() {
        alertRepository.deleteAll();
        telemetryAnomalyRepository.deleteAll();
        telemetryPointRepository.deleteAll();
        satelliteRepository.deleteAll();
        missionRepository.deleteAll();
    }

    @Test
    void adminShouldImportTelemetryCsv() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(validCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importId").isString())
                .andExpect(jsonPath("$.importedCount").value(2))
                .andExpect(jsonPath("$.errorCount").value(0))
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors.length()").value(0));

        assertThat(telemetryPointRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()))
                .hasSize(2);
    }

    @Test
    void operatorShouldImportTelemetryCsv() throws Exception {
        String token = loginAndGetToken("operator@finalspace.com", "operator123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(validCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedCount").value(2))
                .andExpect(jsonPath("$.errorCount").value(0));

        assertThat(telemetryPointRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()))
                .hasSize(2);
    }

    @Test
    void readerShouldNotImportTelemetryCsv() throws Exception {
        String token = loginAndGetToken("reader@finalspace.com", "reader123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(validCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        assertThat(telemetryPointRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()))
                .isEmpty();
    }

    @Test
    void unauthenticatedUserShouldNotImportTelemetryCsv() throws Exception {
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(validCsvFile()))
                .andExpect(status().isUnauthorized());

        assertThat(telemetryPointRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()))
                .isEmpty();
    }

    @Test
    void shouldRejectInvalidCsvAndNotPersistPartialData() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(invalidCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.importId").doesNotExist())
                .andExpect(jsonPath("$.importedCount").value(0))
                .andExpect(jsonPath("$.errorCount").value(3))
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors[0].line").value(3))
                .andExpect(jsonPath("$.errors[1].line").value(4))
                .andExpect(jsonPath("$.errors[2].line").value(5));

        assertThat(telemetryPointRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()))
                .isEmpty();
    }

    @Test
    void shouldRejectImportForInactiveSatellite() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createInactiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(validCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        assertThat(telemetryPointRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()))
                .isEmpty();
    }

    @Test
    void shouldRejectImportForClosedMission() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createSatelliteOnClosedMission();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(validCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        assertThat(telemetryPointRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()))
                .isEmpty();
    }

    @Test
    void shouldRejectImportWhenSatelliteDoesNotBelongToMission() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        99999L,
                        satellite.getId())
                        .file(validCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        assertThat(telemetryPointRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()))
                .isEmpty();
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

    private MockMultipartFile validCsvFile() {
        return new MockMultipartFile(
                "file",
                "telemetry-valid.csv",
                "text/csv",
                """
                timestamp,metric,value
                2026-01-01T10:00:00Z,temperature,42.5
                2026-01-01T10:00:00Z,battery,78
                """.getBytes(StandardCharsets.UTF_8)
        );
    }

    private MockMultipartFile invalidCsvFile() {
        return new MockMultipartFile(
                "file",
                "telemetry-invalid.csv",
                "text/csv",
                """
                timestamp,metric,value
                2026-01-01T10:00:00Z,temperature,42.5
                date-invalide,battery,78
                2026-01-01T10:05:00Z,,91
                2026-01-01T10:10:00Z,speed,abc
                """.getBytes(StandardCharsets.UTF_8)
        );
    }

    private Satellite createActiveSatellite() {
        return createSatellite(SatelliteStatus.ACTIF, MissionStatus.ACTIVE);
    }

    private Satellite createInactiveSatellite() {
        return createSatellite(SatelliteStatus.INACTIF, MissionStatus.ACTIVE);
    }

    private Satellite createSatelliteOnClosedMission() {
        return createSatellite(SatelliteStatus.ACTIF, MissionStatus.CLOTUREE);
    }

    private Satellite createSatellite(SatelliteStatus satelliteStatus, MissionStatus missionStatus) {
        Mission mission = Mission.builder()
                .name("Mission Telemetry")
                .description("Mission utilisée pour les tests telemetry")
                .status(missionStatus)
                .createdAt(LocalDateTime.now())
                .build();

        Mission savedMission = missionRepository.save(mission);

        Satellite satellite = Satellite.builder()
                .name("TelemetrySat")
                .status(satelliteStatus)
                .massKg(850.0)
                .altitudeKm(500.0)
                .inclinationDeg(95.0)
                .eccentricity(0.4)
                .mission(savedMission)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return satelliteRepository.save(satellite);
    }

    @Test
    void shouldAutomaticallyDetectAnomaliesAfterTelemetryImport() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(anomalyCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedCount").value(12))
                .andExpect(jsonPath("$.errorCount").value(0));

        assertThat(telemetryPointRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()))
                .hasSize(12);

        assertThat(telemetryAnomalyRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()))
                .isNotEmpty();
    }

    private MockMultipartFile anomalyCsvFile() {
        return new MockMultipartFile(
                "file",
                "telemetry-anomalies.csv",
                "text/csv",
                """
                timestamp,metric,value
                2026-01-01T10:00:00Z,temperature,45.0
                2026-01-01T10:05:00Z,temperature,62.0
                2026-01-01T10:10:00Z,temperature,85.0
                2026-01-01T10:30:00Z,temperature,50.0
                2026-01-01T10:00:00Z,battery,78.0
                2026-01-01T10:05:00Z,battery,55.0
                2026-01-01T10:10:00Z,battery,35.0
                2026-01-01T10:25:00Z,battery,18.0
                2026-01-01T10:00:00Z,speed,7600.0
                2026-01-01T10:05:00Z,speed,7820.0
                2026-01-01T10:10:00Z,speed,8050.0
                2026-01-01T10:35:00Z,speed,7700.0
                """.getBytes(StandardCharsets.UTF_8)
        );
    }

    @Test
    void shouldNotDuplicateAnomaliesWhenDetectionIsRunTwice() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(anomalyCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedCount").value(12))
                .andExpect(jsonPath("$.errorCount").value(0));

        int anomalyCountAfterImport =
                telemetryAnomalyRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()).size();

        assertThat(anomalyCountAfterImport).isGreaterThan(0);

        mockMvc.perform(post("/api/satellites/{satelliteId}/anomalies/detect", satellite.getId())
                        .param("metric", "temperature")
                        .param("metric", "battery")
                        .param("metric", "speed")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.satelliteId").value(satellite.getId()))
                .andExpect(jsonPath("$.savedCount").value(0));

        int anomalyCountAfterSecondDetection =
                telemetryAnomalyRepository.findBySatelliteIdOrderByTimestampDesc(satellite.getId()).size();

        assertThat(anomalyCountAfterSecondDetection).isEqualTo(anomalyCountAfterImport);
    }

    @Test
    void shouldAutomaticallyCreateAlertsAfterAnomalyDetectionFromTelemetryImport() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(anomalyCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedCount").value(12))
                .andExpect(jsonPath("$.errorCount").value(0));

        int anomalyCount = telemetryAnomalyRepository
                .findBySatelliteIdOrderByTimestampDesc(satellite.getId())
                .size();

        List<Alert> alerts = alertRepository
                .findByMissionIdOrderByCreatedAtDesc(satellite.getMission().getId());

        assertThat(anomalyCount).isGreaterThan(0);
        assertThat(alerts).hasSize(anomalyCount);

        assertThat(alerts)
                .allSatisfy(alert -> {
                    assertThat(alert.getMission().getId()).isEqualTo(satellite.getMission().getId());
                    assertThat(alert.getSatellite().getId()).isEqualTo(satellite.getId());
                    assertThat(alert.getStatus()).isEqualTo(AlertStatus.ACTIVE);
                    assertThat(alert.getAnomalyId()).isNotBlank();
                    assertThat(alert.getMetric()).isNotBlank();
                    assertThat(alert.getType()).startsWith("ANOMALY_");
                    assertThat(alert.getTelemetryValue()).isNotNull();
                    assertThat(alert.getTelemetryTimestamp()).isNotNull();
                    assertThat(alert.getMessage()).contains("Anomalie");
                });
    }

    @Test
    void shouldNotDuplicateAlertsWhenAnomalyDetectionIsRunTwice() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(multipart("/api/missions/{missionId}/satellites/{satelliteId}/telemetry/import",
                        satellite.getMission().getId(),
                        satellite.getId())
                        .file(anomalyCsvFile())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedCount").value(12))
                .andExpect(jsonPath("$.errorCount").value(0));

        int alertCountAfterImport = alertRepository
                .findByMissionIdOrderByCreatedAtDesc(satellite.getMission().getId())
                .size();

        assertThat(alertCountAfterImport).isGreaterThan(0);

        mockMvc.perform(post("/api/satellites/{satelliteId}/anomalies/detect", satellite.getId())
                        .param("metric", "temperature")
                        .param("metric", "battery")
                        .param("metric", "speed")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.satelliteId").value(satellite.getId()))
                .andExpect(jsonPath("$.savedCount").value(0));

        int alertCountAfterSecondDetection = alertRepository
                .findByMissionIdOrderByCreatedAtDesc(satellite.getMission().getId())
                .size();

        assertThat(alertCountAfterSecondDetection).isEqualTo(alertCountAfterImport);
    }
}