package com.finalspace.backend.security;

import com.finalspace.backend.incident.Incident;
import com.finalspace.backend.incident.IncidentRepository;
import com.finalspace.backend.incident.IncidentSeverity;
import com.finalspace.backend.incident.IncidentStatus;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class IncidentAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Test
    void shouldAllowAdminToCreateIncident() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Mission mission = createActiveMission();

        mockMvc.perform(post("/api/missions/" + mission.getId() + "/incidents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "satelliteId": null,
                                  "alertId": null,
                                  "title": "Incident admin",
                                  "description": "Incident créé par admin",
                                  "notes": "Analyse initiale",
                                  "severity": "MOYENNE"
                                }
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldAllowOperatorToCreateIncident() throws Exception {
        String operatorToken = loginAndGetToken("operator@finalspace.com", "operator123");
        Mission mission = createActiveMission();

        mockMvc.perform(post("/api/missions/" + mission.getId() + "/incidents")
                        .header("Authorization", "Bearer " + operatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "satelliteId": null,
                                  "alertId": null,
                                  "title": "Incident opérateur",
                                  "description": "Incident créé par opérateur",
                                  "notes": "Analyse initiale",
                                  "severity": "ELEVEE"
                                }
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldForbidReaderFromCreatingIncident() throws Exception {
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");
        Mission mission = createActiveMission();

        mockMvc.perform(post("/api/missions/" + mission.getId() + "/incidents")
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "satelliteId": null,
                                  "alertId": null,
                                  "title": "Incident lecteur",
                                  "description": "Création interdite",
                                  "notes": null,
                                  "severity": "FAIBLE"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectCreateIncidentWithoutToken() throws Exception {
        Mission mission = createActiveMission();

        mockMvc.perform(post("/api/missions/" + mission.getId() + "/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "satelliteId": null,
                                  "alertId": null,
                                  "title": "Incident sans token",
                                  "description": "Création interdite",
                                  "notes": null,
                                  "severity": "FAIBLE"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnNotFoundWhenCreatingIncidentForUnknownMission() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");

        mockMvc.perform(post("/api/missions/99999/incidents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "satelliteId": null,
                                  "alertId": null,
                                  "title": "Incident mission inconnue",
                                  "description": "Mission inexistante",
                                  "notes": null,
                                  "severity": "MOYENNE"
                                }
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectCreateIncidentOnClosedMission() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Mission mission = createClosedMission();

        mockMvc.perform(post("/api/missions/" + mission.getId() + "/incidents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "satelliteId": null,
                                  "alertId": null,
                                  "title": "Incident mission clôturée",
                                  "description": "Création interdite",
                                  "notes": null,
                                  "severity": "MOYENNE"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldAllowAllRolesToListIncidents() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String operatorToken = loginAndGetToken("operator@finalspace.com", "operator123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");

        Mission mission = createActiveMission();
        createIncident(mission, IncidentStatus.OUVERT);

        mockMvc.perform(get("/api/missions/" + mission.getId() + "/incidents")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/missions/" + mission.getId() + "/incidents")
                        .header("Authorization", "Bearer " + operatorToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/missions/" + mission.getId() + "/incidents")
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowFilterIncidentsByStatus() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Mission mission = createActiveMission();
        createIncident(mission, IncidentStatus.OUVERT);

        mockMvc.perform(get("/api/missions/" + mission.getId() + "/incidents")
                        .param("status", "OUVERT")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowAllRolesToReadIncidentDetail() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");

        Mission mission = createActiveMission();
        Incident incident = createIncident(mission, IncidentStatus.OUVERT);

        mockMvc.perform(get("/api/incidents/" + incident.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/incidents/" + incident.getId())
                        .header("Authorization", "Bearer " + readerToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowAdminToUpdateIncident() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Mission mission = createActiveMission();
        Incident incident = createIncident(mission, IncidentStatus.OUVERT);

        mockMvc.perform(put("/api/incidents/" + incident.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Incident modifié",
                                  "description": "Description modifiée",
                                  "notes": "Notes modifiées",
                                  "severity": "ELEVEE"
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void shouldForbidReaderFromUpdatingIncident() throws Exception {
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");
        Mission mission = createActiveMission();
        Incident incident = createIncident(mission, IncidentStatus.OUVERT);

        mockMvc.perform(put("/api/incidents/" + incident.getId())
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Modification lecteur",
                                  "description": "Interdit",
                                  "notes": null,
                                  "severity": "FAIBLE"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowAdminToMoveIncidentToInProgress() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Mission mission = createActiveMission();
        Incident incident = createIncident(mission, IncidentStatus.OUVERT);

        mockMvc.perform(post("/api/incidents/" + incident.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "EN_COURS"
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void shouldForbidReaderFromChangingStatus() throws Exception {
        String readerToken = loginAndGetToken("reader@finalspace.com", "reader123");
        Mission mission = createActiveMission();
        Incident incident = createIncident(mission, IncidentStatus.OUVERT);

        mockMvc.perform(post("/api/incidents/" + incident.getId() + "/status")
                        .header("Authorization", "Bearer " + readerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "EN_COURS"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowAdminToCloseIncident() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Mission mission = createActiveMission();
        Incident incident = createIncident(mission, IncidentStatus.EN_COURS);

        mockMvc.perform(post("/api/incidents/" + incident.getId() + "/close")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectUpdateClosedIncident() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Mission mission = createActiveMission();
        Incident incident = createIncident(mission, IncidentStatus.CLOTURE);

        mockMvc.perform(put("/api/incidents/" + incident.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Modification interdite",
                                  "description": "Incident clôturé",
                                  "notes": null,
                                  "severity": "FAIBLE"
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

    private Mission createActiveMission() {
        Mission mission = Mission.builder()
                .name("Mission Incident Test")
                .description("Mission utilisée pour tester les incidents")
                .status(MissionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .closedAt(null)
                .build();

        return missionRepository.save(mission);
    }

    private Mission createClosedMission() {
        Mission mission = Mission.builder()
                .name("Mission Incident Clôturée")
                .description("Mission clôturée utilisée pour tester les incidents")
                .status(MissionStatus.CLOTUREE)
                .createdAt(LocalDateTime.now().minusDays(1))
                .closedAt(LocalDateTime.now())
                .build();

        return missionRepository.save(mission);
    }

    private Incident createIncident(Mission mission, IncidentStatus status) {
        LocalDateTime now = LocalDateTime.now();

        Incident incident = Incident.builder()
                .mission(mission)
                .satellite(null)
                .alert(null)
                .title("Incident test")
                .description("Incident utilisé pour les tests")
                .notes("Notes de test")
                .severity(IncidentSeverity.MOYENNE)
                .status(status)
                .createdAt(now.minusHours(1))
                .updatedAt(now)
                .closedAt(status == IncidentStatus.CLOTURE ? now : null)
                .createdBy("admin@finalspace.com")
                .build();

        return incidentRepository.save(incident);
    }

    @Test
    void shouldRejectUpdateIncidentWhenMissionIsClosed() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Mission mission = createClosedMission();
        Incident incident = createIncident(mission, IncidentStatus.OUVERT);

        mockMvc.perform(put("/api/incidents/" + incident.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "title": "Modification interdite",
                              "description": "Mission clôturée",
                              "notes": null,
                              "severity": "FAIBLE"
                            }
                            """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectStatusUpdateWhenMissionIsClosed() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Mission mission = createClosedMission();
        Incident incident = createIncident(mission, IncidentStatus.OUVERT);

        mockMvc.perform(post("/api/incidents/" + incident.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "status": "EN_COURS"
                            }
                            """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectCloseIncidentWhenMissionIsClosed() throws Exception {
        String adminToken = loginAndGetToken("admin@finalspace.com", "admin123");
        Mission mission = createClosedMission();
        Incident incident = createIncident(mission, IncidentStatus.OUVERT);

        mockMvc.perform(post("/api/incidents/" + incident.getId() + "/close")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }
}