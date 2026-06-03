package com.finalspace.backend.security;

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
class MissionAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @Test
    void shouldRejectMissionReadWithoutToken() throws Exception {
        mockMvc.perform(get("/api/missions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectMissionReadWithInvalidToken() throws Exception {
        mockMvc.perform(get("/api/missions")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowAdminToCreateMission() throws Exception {
        String token = loginAndGetToken("admin@finalspace.com", "admin123");

        mockMvc.perform(post("/api/missions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Mission Admin",
                                  "description": "Créée par admin"
                                }
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldAllowOperatorToCreateMission() throws Exception {
        String token = loginAndGetToken("operator@finalspace.com", "operator123");

        mockMvc.perform(post("/api/missions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Mission Operateur",
                                  "description": "Créée par opérateur"
                                }
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldForbidReaderFromCreatingMission() throws Exception {
        String token = loginAndGetToken("reader@finalspace.com", "reader123");

        mockMvc.perform(post("/api/missions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Mission Interdite",
                                  "description": "Création lecteur"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowReaderToReadMissions() throws Exception {
        String token = loginAndGetToken("reader@finalspace.com", "reader123");

        mockMvc.perform(get("/api/missions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void shouldForbidReaderFromUpdatingMission() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");

        String missionId = createMissionAndGetId(adminToken);

        mockMvc.perform(put("/api/missions/" + missionId)
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Modification interdite",
                                  "description": "Lecteur"
                                }
                                """))
                .andExpect(status().isForbidden());
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

    private String createMissionAndGetId(String token) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/missions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Mission de référence",
                                  "description": "Utilisée pour tester les droits"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        return jsonMapper.readTree(result.getResponse().getContentAsString())
                .get("id")
                .asText();
    }
}