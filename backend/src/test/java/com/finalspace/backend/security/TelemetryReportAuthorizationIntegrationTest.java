package com.finalspace.backend.security;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.alert.AlertSeverity;
import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.telemetry.TelemetryPoint;
import com.finalspace.backend.telemetry.TelemetryPointRepository;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomaly;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalyRepository;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalySeverity;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalyType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TelemetryReportAuthorizationIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@finalspace.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private SatelliteRepository satelliteRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private TelemetryPointRepository telemetryPointRepository;

    @Autowired
    private TelemetryAnomalyRepository telemetryAnomalyRepository;

    @BeforeEach
    @AfterEach
    void cleanDatabase() {
        telemetryAnomalyRepository.deleteAll();
        telemetryPointRepository.deleteAll();
        alertRepository.deleteAll();
        satelliteRepository.deleteAll();
        missionRepository.deleteAll();
    }

    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void shouldExportTelemetryReportCsvAsAdmin() throws Exception {
        Satellite satellite = createSatelliteWithTelemetryData();

        MvcResult result = mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/report/csv", satellite.getId())
                        .param("metric", "temperature")
                        .param("metric", "battery"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("telemetry-report-" + satellite.getId() + ".csv")
                ))
                .andReturn();

        String csv = result.getResponse().getContentAsString(StandardCharsets.UTF_8)
                .replace("\uFEFF", "");

        assertThat(csv)
                .isNotBlank()
                .startsWith(
                "missionId;missionName;satelliteId;satelliteName;timestamp;metric;value;anomalyFlag;anomalyType;anomalySeverity;anomalyMessage"
                )
                .contains("temperature")
                .contains("battery")
                .contains("true")
                .contains("THRESHOLD");
    }

    @Test
    @WithMockUser(username = "lecteur@finalspace.com", roles = "LECTEUR")
    void shouldExportTelemetryReportCsvAsLecteur() throws Exception {
        Satellite satellite = createSatelliteWithTelemetryData();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/report/csv", satellite.getId())
                        .param("metric", "temperature"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("telemetry-report-" + satellite.getId() + ".csv")
                ));
    }

    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void shouldExportTelemetryReportPdfAsAdmin() throws Exception {
        Satellite satellite = createSatelliteWithTelemetryData();

        MvcResult result = mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/report/pdf", satellite.getId())
                        .param("metric", "temperature")
                        .param("metric", "battery"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PDF))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("telemetry-report-" + satellite.getId() + ".pdf")
                ))
                .andReturn();

        byte[] pdf = result.getResponse().getContentAsByteArray();

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    @WithMockUser(username = "lecteur@finalspace.com", roles = "LECTEUR")
    void shouldExportTelemetryReportPdfAsLecteur() throws Exception {
        Satellite satellite = createSatelliteWithTelemetryData();

        MvcResult result = mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/report/pdf", satellite.getId())
                        .param("metric", "temperature"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PDF))
                .andReturn();

        byte[] pdf = result.getResponse().getContentAsByteArray();

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void shouldFilterTelemetryReportByMetric() throws Exception {
        Satellite satellite = createSatelliteWithTelemetryData();

        MvcResult result = mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/report/csv", satellite.getId())
                        .param("metric", "temperature"))
                .andExpect(status().isOk())
                .andReturn();

        String csv = result.getResponse().getContentAsString(StandardCharsets.UTF_8)
                .replace("\uFEFF", "");

        assertThat(csv)
                .contains("temperature")
                .doesNotContain(";battery;");
    }

    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void shouldFilterTelemetryReportByPeriod() throws Exception {
        Satellite satellite = createSatelliteWithTelemetryData();

        MvcResult result = mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/report/csv", satellite.getId())
                        .param("metric", "temperature")
                        .param("from", "2026-01-01T10:05:00Z")
                        .param("to", "2026-01-01T10:10:00Z"))
                .andExpect(status().isOk())
                .andReturn();

        String csv = result.getResponse().getContentAsString(StandardCharsets.UTF_8)
                .replace("\uFEFF", "");

        assertThat(csv)
                .contains("2026-01-01T10:05:00Z")
                .contains("2026-01-01T10:10:00Z")
                .doesNotContain("2026-01-01T10:00:00Z");
    }

    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void shouldReturnNotFoundWhenSatelliteDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/report/pdf", 999999L)
                        .param("metric", "temperature"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void shouldRejectMissingMetric() throws Exception {
        Satellite satellite = createSatelliteWithTelemetryData();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/report/pdf", satellite.getId()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = ADMIN_EMAIL, roles = "ADMIN")
    void shouldRejectInvalidPeriod() throws Exception {
        Satellite satellite = createSatelliteWithTelemetryData();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/report/pdf", satellite.getId())
                        .param("metric", "temperature")
                        .param("from", "2026-01-02T10:00:00Z")
                        .param("to", "2026-01-01T10:00:00Z"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectUnauthenticatedUser() throws Exception {
        Satellite satellite = createSatelliteWithTelemetryData();

        mockMvc.perform(get("/api/satellites/{satelliteId}/telemetry/report/pdf", satellite.getId())
                        .param("metric", "temperature"))
                .andExpect(status().isUnauthorized());
    }

    private Satellite createSatelliteWithTelemetryData() {
        Mission mission = missionRepository.save(
                Mission.builder()
                        .name("Mission télémétrie US21")
                        .description("Mission utilisée pour valider le rapport de télémétrie.")
                        .status(MissionStatus.ACTIVE)
                        .createdAt(LocalDateTime.now().minusDays(10))
                        .build()
        );

        Satellite satellite = satelliteRepository.save(
                Satellite.builder()
                        .mission(mission)
                        .name("US21-SAT")
                        .status(SatelliteStatus.ACTIF)
                        .massKg(850.0)
                        .altitudeKm(500.0)
                        .inclinationDeg(95.0)
                        .eccentricity(0.01)
                        .createdAt(LocalDateTime.now().minusDays(9))
                        .updatedAt(LocalDateTime.now().minusDays(1))
                        .build()
        );

        telemetryPointRepository.save(
                TelemetryPoint.builder()
                        .missionId(mission.getId())
                        .satelliteId(satellite.getId())
                        .timestamp(Instant.parse("2026-01-01T10:00:00Z"))
                        .metric("temperature")
                        .value(40.0)
                        .sourceImportId("import-us21")
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        telemetryPointRepository.save(
                TelemetryPoint.builder()
                        .missionId(mission.getId())
                        .satelliteId(satellite.getId())
                        .timestamp(Instant.parse("2026-01-01T10:05:00Z"))
                        .metric("temperature")
                        .value(62.0)
                        .sourceImportId("import-us21")
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        telemetryPointRepository.save(
                TelemetryPoint.builder()
                        .missionId(mission.getId())
                        .satelliteId(satellite.getId())
                        .timestamp(Instant.parse("2026-01-01T10:10:00Z"))
                        .metric("temperature")
                        .value(85.0)
                        .sourceImportId("import-us21")
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        telemetryPointRepository.save(
                TelemetryPoint.builder()
                        .missionId(mission.getId())
                        .satelliteId(satellite.getId())
                        .timestamp(Instant.parse("2026-01-01T10:05:00Z"))
                        .metric("battery")
                        .value(78.0)
                        .sourceImportId("import-us21")
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        telemetryAnomalyRepository.save(
                TelemetryAnomaly.builder()
                        .missionId(mission.getId())
                        .satelliteId(satellite.getId())
                        .metric("temperature")
                        .type(TelemetryAnomalyType.THRESHOLD)
                        .severity(TelemetryAnomalySeverity.ELEVEE)
                        .timestamp(Instant.parse("2026-01-01T10:10:00Z"))
                        .value(85.0)
                        .previousValue(62.0)
                        .previousTimestamp(Instant.parse("2026-01-01T10:05:00Z"))
                        .ruleName("TEMP_MAX")
                        .thresholdUsed(80.0)
                        .message("Valeur supérieure au seuil critique")
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        alertRepository.save(
                Alert.builder()
                        .mission(mission)
                        .satellite(satellite)
                        .metric("temperature")
                        .type("ANOMALY_THRESHOLD")
                        .severity(AlertSeverity.ELEVEE)
                        .status(AlertStatus.ACTIVE)
                        .message("Température critique détectée.")
                        .createdAt(LocalDateTime.now().minusHours(1))
                        .telemetryValue(85.0)
                        .telemetryTimestamp(Instant.parse("2026-01-01T10:10:00Z"))
                        .build()
        );

        return satellite;
    }
}