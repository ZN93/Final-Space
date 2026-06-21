package com.finalspace.backend.security;

import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.simulation.SimulationRunRepository;
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
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SimulationAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private SatelliteRepository satelliteRepository;

    @Autowired
    private SimulationRunRepository simulationRunRepository;

    @Test
    void shouldAllowAdminToLaunchOrbitSimulation() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/orbit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated());

        assertEquals(1, simulationRunRepository.findBySatelliteIdOrderByCreatedAtDesc(satellite.getId()).size());
    }

    @Test
    void shouldAllowOperatorToLaunchOrbitSimulation() throws Exception {
        String operatorToken = loginAndGetToken("operator@finalspace.com", "operator123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/orbit")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isCreated());

        assertEquals(1, simulationRunRepository.findBySatelliteIdOrderByCreatedAtDesc(satellite.getId()).size());
    }

    @Test
    void shouldForbidReaderFromLaunchingOrbitSimulation() throws Exception {
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/orbit")
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectLaunchWithoutToken() throws Exception {
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/orbit"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnNotFoundWhenSatelliteDoesNotExist() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");

        mockMvc.perform(post("/api/satellites/99999/simulations/orbit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectLaunchForInactiveSatellite() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createInactiveSatellite();

        mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/orbit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectLaunchForSatelliteOnClosedMission() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatelliteOnClosedMission();

        mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/orbit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnSimulationResultPayload() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        MvcResult result = mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/orbit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode response = jsonMapper.readTree(result.getResponse().getContentAsString());

        assertEquals(satellite.getId(), response.get("satelliteId").asLong());
        assertEquals("ORBIT", response.get("type").asText());
        assertEquals("SUCCESS", response.get("status").asText());
        assertTrue(response.get("orbitalPeriodMinutes").asDouble() > 0);
        assertTrue(response.get("averageVelocityKmS").asDouble() > 0);
        assertTrue(response.get("plotDataJson").asText().contains("\"x\""));
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

    private Mission createActiveMission() {
        Mission mission = Mission.builder()
                .name("Mission Simulation Test")
                .description("Mission utilisée pour tester les simulations")
                .status(MissionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .closedAt(null)
                .build();

        return missionRepository.save(mission);
    }

    private Mission createClosedMission() {
        Mission mission = Mission.builder()
                .name("Mission Simulation Clôturée")
                .description("Mission clôturée utilisée pour tester les simulations")
                .status(MissionStatus.CLOTUREE)
                .createdAt(LocalDateTime.now().minusDays(1))
                .closedAt(LocalDateTime.now())
                .build();

        return missionRepository.save(mission);
    }

    private Satellite createActiveSatellite() {
        Mission mission = createActiveMission();

        Satellite satellite = Satellite.builder()
                .mission(mission)
                .name("OrbitSat-01")
                .status(SatelliteStatus.ACTIF)
                .massKg(900.0)
                .altitudeKm(420.0)
                .inclinationDeg(52.0)
                .eccentricity(0.002)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return satelliteRepository.save(satellite);
    }

    private Satellite createInactiveSatellite() {
        Mission mission = createActiveMission();

        Satellite satellite = Satellite.builder()
                .mission(mission)
                .name("InactiveOrbitSat-01")
                .status(SatelliteStatus.INACTIF)
                .massKg(900.0)
                .altitudeKm(420.0)
                .inclinationDeg(52.0)
                .eccentricity(0.002)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return satelliteRepository.save(satellite);
    }

    private Satellite createActiveSatelliteOnClosedMission() {
        Mission mission = createClosedMission();

        Satellite satellite = Satellite.builder()
                .mission(mission)
                .name("ClosedMissionOrbitSat-01")
                .status(SatelliteStatus.ACTIF)
                .massKg(900.0)
                .altitudeKm(420.0)
                .inclinationDeg(52.0)
                .eccentricity(0.002)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return satelliteRepository.save(satellite);
    }

    private String hohmannRequestJson(Double altitudeTargetKm) {
        return """
            {
              "altitudeTargetKm": %s
            }
            """.formatted(altitudeTargetKm);
    }

    @Test
    void adminShouldLaunchHohmannTransfer() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/{id}/simulations/hohmann", satellite.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hohmannRequestJson(800.0)))
                .andExpect(status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.type").value("HOHMANN"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value("SUCCESS"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.targetAltitudeKm").value(800.0))
                .andExpect(MockMvcResultMatchers.jsonPath("$.deltaV1MS").isNumber())
                .andExpect(MockMvcResultMatchers.jsonPath("$.deltaV2MS").isNumber())
                .andExpect(MockMvcResultMatchers.jsonPath("$.deltaVTotalMS").isNumber())
                .andExpect(MockMvcResultMatchers.jsonPath("$.transferTimeMinutes").isNumber());

        assertEquals(1, simulationRunRepository.findBySatelliteIdOrderByCreatedAtDesc(satellite.getId()).size());
    }

    @Test
    void operatorShouldLaunchHohmannTransfer() throws Exception {
        String token = loginAndGetToken("operator@finalspace.com", "operator123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/{id}/simulations/hohmann", satellite.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hohmannRequestJson(900.0)))
                .andExpect(status().isCreated())
                .andExpect(MockMvcResultMatchers.jsonPath("$.type").value("HOHMANN"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value("SUCCESS"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.targetAltitudeKm").value(900.0));

        assertEquals(1, simulationRunRepository.findBySatelliteIdOrderByCreatedAtDesc(satellite.getId()).size());
    }

    @Test
    void readerShouldNotLaunchHohmannTransfer() throws Exception {
        String token = loginAndGetToken("reader@finalspace.com", "reader123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/{id}/simulations/hohmann", satellite.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hohmannRequestJson(800.0)))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedUserShouldNotLaunchHohmannTransfer() throws Exception {
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/{id}/simulations/hohmann", satellite.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hohmannRequestJson(800.0)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectHohmannTransferOnInactiveSatellite() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createInactiveSatellite();

        mockMvc.perform(post("/api/satellites/{id}/simulations/hohmann", satellite.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hohmannRequestJson(800.0)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectHohmannTransferWithSameAltitude() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/{id}/simulations/hohmann", satellite.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hohmannRequestJson(satellite.getAltitudeKm())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectHohmannTransferWithNegativeTargetAltitude() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/{id}/simulations/hohmann", satellite.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hohmannRequestJson(-100.0)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldAllowAdminToListSatelliteSimulationHistory() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/orbit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/hohmann")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hohmannRequestJson(800.0)))
                .andExpect(status().isCreated());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/satellites/" + satellite.getId() + "/simulations")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$").isArray())
                .andExpect(MockMvcResultMatchers.jsonPath("$.length()").value(2))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].id").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].type").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].createdAt").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].createdBy").exists());
    }

    @Test
    void shouldAllowReaderToListSatelliteSimulationHistory() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/orbit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/satellites/" + satellite.getId() + "/simulations")
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$").isArray())
                .andExpect(MockMvcResultMatchers.jsonPath("$.length()").value(1));
    }

    @Test
    void shouldReturnNotFoundWhenListingHistoryForUnknownSatellite() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/satellites/99999/simulations")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectSimulationHistoryListWithoutToken() throws Exception {
        Satellite satellite = createActiveSatellite();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/satellites/" + satellite.getId() + "/simulations"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowAdminToGetSimulationDetail() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Satellite satellite = createActiveSatellite();

        MvcResult creationResult = mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/hohmann")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hohmannRequestJson(800.0)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode creationResponse = jsonMapper.readTree(creationResult.getResponse().getContentAsString());
        long simulationId = creationResponse.get("id").asLong();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/simulations/" + simulationId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(simulationId))
                .andExpect(MockMvcResultMatchers.jsonPath("$.type").value("HOHMANN"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value("SUCCESS"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.satelliteId").value(satellite.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.targetAltitudeKm").value(800.0))
                .andExpect(MockMvcResultMatchers.jsonPath("$.deltaVTotalMS").isNumber())
                .andExpect(MockMvcResultMatchers.jsonPath("$.plotDataJson").exists());
    }

    @Test
    void shouldAllowReaderToGetSimulationDetail() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");
        Satellite satellite = createActiveSatellite();

        MvcResult creationResult = mockMvc.perform(post("/api/satellites/" + satellite.getId() + "/simulations/orbit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode creationResponse = jsonMapper.readTree(creationResult.getResponse().getContentAsString());
        long simulationId = creationResponse.get("id").asLong();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/simulations/" + simulationId)
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(simulationId))
                .andExpect(MockMvcResultMatchers.jsonPath("$.type").value("ORBIT"))
                .andExpect(MockMvcResultMatchers.jsonPath("$.plotDataJson").exists());
    }

    @Test
    void shouldReturnNotFoundWhenSimulationDetailDoesNotExist() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/simulations/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectSimulationDetailWithoutToken() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/simulations/1"))
                .andExpect(status().isUnauthorized());
    }
}