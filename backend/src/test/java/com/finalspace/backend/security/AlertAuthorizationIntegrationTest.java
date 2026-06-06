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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AlertAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @Test
    void shouldAllowAdminToListMissionAlerts() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Long missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(get("/api/missions/" + missionId + "/alerts")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowOperatorToListMissionAlerts() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String operatorToken = loginAndGetToken("operator@finalspace.com", "operator123");

        Long missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(get("/api/missions/" + missionId + "/alerts")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowReaderToListMissionAlerts() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");

        Long missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(get("/api/missions/" + missionId + "/alerts")
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectListMissionAlertsWithoutToken() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Long missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(get("/api/missions/" + missionId + "/alerts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnNotFoundWhenMissionDoesNotExist() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");

        mockMvc.perform(get("/api/missions/99999/alerts")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldAllowFilterActiveAlerts() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Long missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(get("/api/missions/" + missionId + "/alerts")
                        .param("status", "ACTIVE")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowFilterAcknowledgedAlerts() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Long missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(get("/api/missions/" + missionId + "/alerts")
                        .param("status", "ACQUITTEE")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
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
                                  "name": "Mission Alert Test",
                                  "description": "Mission utilisée pour tester les alertes"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode response = jsonMapper.readTree(result.getResponse().getContentAsString());
        return response.get("id").asLong();
    }
}