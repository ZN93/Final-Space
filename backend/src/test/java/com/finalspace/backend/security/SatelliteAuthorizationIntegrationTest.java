package com.finalspace.backend.security;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SatelliteAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @Test
    void shouldAllowAdminToCreateSatelliteInActiveMission() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Long missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(post("/api/missions/" + missionId + "/satellites")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "AdminSat-01",
                                  "massKg": 850,
                                  "altitudeKm": 400,
                                  "inclinationDeg": 51.6,
                                  "eccentricity": 0.001
                                }
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldAllowOperatorToCreateSatelliteInActiveMission() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String operatorToken = loginAndGetToken("operator@finalspace.com", "operator123");

        Long missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(post("/api/missions/" + missionId + "/satellites")
                        .header("Authorization", "Bearer " + operatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "OperatorSat-01",
                                  "massKg": 850,
                                  "altitudeKm": 400,
                                  "inclinationDeg": 51.6,
                                  "eccentricity": 0.001
                                }
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldForbidReaderFromCreatingSatellite() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");

        Long missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(post("/api/missions/" + missionId + "/satellites")
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "ReaderSat-Forbidden",
                                  "massKg": 850,
                                  "altitudeKm": 400,
                                  "inclinationDeg": 51.6,
                                  "eccentricity": 0.001
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowReaderToListSatellitesByMission() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");

        Long missionId = createMissionAndGetId(adminToken);
        createSatelliteAndGetId(adminToken, missionId);

        mockMvc.perform(get("/api/missions/" + missionId + "/satellites")
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowReaderToReadSatelliteDetail() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");

        Long missionId = createMissionAndGetId(adminToken);
        Long satelliteId = createSatelliteAndGetId(adminToken, missionId);

        mockMvc.perform(get("/api/satellites/" + satelliteId)
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldForbidReaderFromUpdatingSatellite() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");

        Long missionId = createMissionAndGetId(adminToken);
        Long satelliteId = createSatelliteAndGetId(adminToken, missionId);

        mockMvc.perform(put("/api/satellites/" + satelliteId)
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Reader Update Forbidden",
                                  "massKg": 900,
                                  "altitudeKm": 420,
                                  "inclinationDeg": 52,
                                  "eccentricity": 0.002
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldForbidReaderFromDisablingSatellite() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");

        Long missionId = createMissionAndGetId(adminToken);
        Long satelliteId = createSatelliteAndGetId(adminToken, missionId);

        mockMvc.perform(post("/api/satellites/" + satelliteId + "/disable")
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectCreateSatelliteInClosedMission() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");

        Long missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(post("/api/missions/" + missionId + "/close")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/missions/" + missionId + "/satellites")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "ClosedMissionSat",
                                  "massKg": 850,
                                  "altitudeKm": 400,
                                  "inclinationDeg": 51.6,
                                  "eccentricity": 0.001
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldAllowAdminToUpdateActiveSatellite() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");

        Long missionId = createMissionAndGetId(adminToken);
        Long satelliteId = createSatelliteAndGetId(adminToken, missionId);

        mockMvc.perform(put("/api/satellites/" + satelliteId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "UpdatedSat-01",
                                  "massKg": 900,
                                  "altitudeKm": 420,
                                  "inclinationDeg": 52,
                                  "eccentricity": 0.002
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowAdminToDisableSatellite() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");

        Long missionId = createMissionAndGetId(adminToken);
        Long satelliteId = createSatelliteAndGetId(adminToken, missionId);

        mockMvc.perform(post("/api/satellites/" + satelliteId + "/disable")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectUpdateInactiveSatellite() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");

        Long missionId = createMissionAndGetId(adminToken);
        Long satelliteId = createSatelliteAndGetId(adminToken, missionId);

        mockMvc.perform(post("/api/satellites/" + satelliteId + "/disable")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/satellites/" + satelliteId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Inactive Update",
                                  "massKg": 900,
                                  "altitudeKm": 420,
                                  "inclinationDeg": 52,
                                  "eccentricity": 0.002
                                }
                                """))
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

    private Long createMissionAndGetId(String token) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/missions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Mission Satellite Test",
                                  "description": "Mission utilisée pour tester les satellites"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode response = jsonMapper.readTree(result.getResponse().getContentAsString());
        return response.get("id").asLong();
    }

    private Long createSatelliteAndGetId(String token, Long missionId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/missions/" + missionId + "/satellites")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "TestSat-01",
                                  "massKg": 850,
                                  "altitudeKm": 400,
                                  "inclinationDeg": 51.6,
                                  "eccentricity": 0.001
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode response = jsonMapper.readTree(result.getResponse().getContentAsString());
        return response.get("id").asLong();
    }
}