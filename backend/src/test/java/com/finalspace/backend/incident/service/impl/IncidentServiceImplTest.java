package com.finalspace.backend.incident.service.impl;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.alert.AlertSeverity;
import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.incident.Incident;
import com.finalspace.backend.incident.IncidentRepository;
import com.finalspace.backend.incident.IncidentSeverity;
import com.finalspace.backend.incident.IncidentStatus;
import com.finalspace.backend.incident.dto.IncidentCreateRequest;
import com.finalspace.backend.incident.dto.IncidentResponse;
import com.finalspace.backend.incident.dto.IncidentUpdateRequest;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceImplTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private MissionRepository missionRepository;

    @Mock
    private SatelliteRepository satelliteRepository;

    @Mock
    private AlertRepository alertRepository;

    @InjectMocks
    private IncidentServiceImpl incidentService;

    private Mission activeMission;
    private Mission closedMission;
    private Mission otherMission;
    private Satellite satellite;
    private Satellite otherMissionSatellite;
    private Alert alert;
    private Incident openIncident;
    private Incident inProgressIncident;
    private Incident closedIncident;
    private Incident openIncidentOnClosedMission;

    @BeforeEach
    void setUp() {
        activeMission = Mission.builder()
                .id(1L)
                .name("Mission Artemis")
                .description("Mission active")
                .status(MissionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .closedAt(null)
                .build();

        closedMission = Mission.builder()
                .id(2L)
                .name("Mission clôturée")
                .description("Mission clôturée")
                .status(MissionStatus.CLOTUREE)
                .createdAt(LocalDateTime.now())
                .closedAt(LocalDateTime.now())
                .build();

        otherMission = Mission.builder()
                .id(3L)
                .name("Autre mission")
                .description("Autre mission")
                .status(MissionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .closedAt(null)
                .build();

        satellite = Satellite.builder()
                .id(10L)
                .name("LunaSat-01")
                .status(SatelliteStatus.ACTIF)
                .massKg(850.0)
                .altitudeKm(400.0)
                .inclinationDeg(51.6)
                .eccentricity(0.001)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .mission(activeMission)
                .build();

        otherMissionSatellite = Satellite.builder()
                .id(11L)
                .name("OtherSat-01")
                .status(SatelliteStatus.ACTIF)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .mission(otherMission)
                .build();

        alert = Alert.builder()
                .id(100L)
                .mission(activeMission)
                .satellite(satellite)
                .metric("temperature")
                .type("THERMAL_ANOMALY")
                .severity(AlertSeverity.ELEVEE)
                .status(AlertStatus.ACTIVE)
                .message("Température satellite supérieure au seuil")
                .createdAt(LocalDateTime.now())
                .build();

        openIncident = Incident.builder()
                .id(200L)
                .mission(activeMission)
                .satellite(satellite)
                .alert(alert)
                .title("Incident thermique")
                .description("Température élevée détectée")
                .notes("Analyse initiale")
                .severity(IncidentSeverity.ELEVEE)
                .status(IncidentStatus.OUVERT)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .closedAt(null)
                .createdBy("admin@finalspace.com")
                .build();

        inProgressIncident = Incident.builder()
                .id(201L)
                .mission(activeMission)
                .satellite(satellite)
                .alert(null)
                .title("Incident en cours")
                .description("Traitement en cours")
                .notes("Suivi")
                .severity(IncidentSeverity.MOYENNE)
                .status(IncidentStatus.EN_COURS)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .closedAt(null)
                .createdBy("operator@finalspace.com")
                .build();

        closedIncident = Incident.builder()
                .id(202L)
                .mission(activeMission)
                .satellite(null)
                .alert(null)
                .title("Incident clôturé")
                .description("Résolu")
                .notes("Terminé")
                .severity(IncidentSeverity.FAIBLE)
                .status(IncidentStatus.CLOTURE)
                .createdAt(LocalDateTime.now().minusDays(1))
                .updatedAt(LocalDateTime.now())
                .closedAt(LocalDateTime.now())
                .createdBy("admin@finalspace.com")
                .build();

        openIncidentOnClosedMission = Incident.builder()
                .id(203L)
                .mission(closedMission)
                .satellite(null)
                .alert(null)
                .title("Incident ouvert sur mission clôturée")
                .description("Incident non clôturé mais mission clôturée")
                .notes("Lecture seule")
                .severity(IncidentSeverity.MOYENNE)
                .status(IncidentStatus.OUVERT)
                .createdAt(LocalDateTime.now().minusHours(2))
                .updatedAt(LocalDateTime.now().minusHours(1))
                .closedAt(null)
                .createdBy("admin@finalspace.com")
                .build();
    }

    @Test
    void shouldCreateIncidentOnActiveMission() {
        IncidentCreateRequest request = new IncidentCreateRequest(
                10L,
                null,
                "Incident thermique",
                "Température élevée détectée",
                "Analyse initiale",
                IncidentSeverity.ELEVEE
        );

        when(missionRepository.findById(1L)).thenReturn(Optional.of(activeMission));
        when(satelliteRepository.findById(10L)).thenReturn(Optional.of(satellite));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
            Incident incident = invocation.getArgument(0);
            incident.setId(200L);
            return incident;
        });

        IncidentResponse response = incidentService.create(1L, request, "admin@finalspace.com");

        assertEquals(200L, response.id());
        assertEquals(1L, response.missionId());
        assertEquals("Mission Artemis", response.missionName());
        assertEquals(10L, response.satelliteId());
        assertEquals("LunaSat-01", response.satelliteName());
        assertNull(response.alertId());
        assertEquals("Incident thermique", response.title());
        assertEquals(IncidentSeverity.ELEVEE, response.severity());
        assertEquals(IncidentStatus.OUVERT, response.status());
        assertEquals("admin@finalspace.com", response.createdBy());
        assertNotNull(response.createdAt());
        assertNotNull(response.updatedAt());
        assertNull(response.closedAt());

        verify(incidentRepository).save(any(Incident.class));
    }

    @Test
    void shouldRejectCreateIncidentWhenMissionDoesNotExist() {
        IncidentCreateRequest request = new IncidentCreateRequest(
                null,
                null,
                "Incident",
                "Description",
                null,
                IncidentSeverity.MOYENNE
        );

        when(missionRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> incidentService.create(99L, request, "admin@finalspace.com")
        );

        assertEquals("Mission introuvable", exception.getMessage());

        verify(incidentRepository, never()).save(any());
    }

    @Test
    void shouldRejectCreateIncidentOnClosedMission() {
        IncidentCreateRequest request = new IncidentCreateRequest(
                null,
                null,
                "Incident",
                "Description",
                null,
                IncidentSeverity.MOYENNE
        );

        when(missionRepository.findById(2L)).thenReturn(Optional.of(closedMission));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> incidentService.create(2L, request, "admin@finalspace.com")
        );

        assertEquals("Impossible de créer un incident dans une mission clôturée", exception.getMessage());

        verify(incidentRepository, never()).save(any());
    }

    @Test
    void shouldRejectCreateIncidentWhenSatelliteDoesNotExist() {
        IncidentCreateRequest request = new IncidentCreateRequest(
                99L,
                null,
                "Incident",
                "Description",
                null,
                IncidentSeverity.MOYENNE
        );

        when(missionRepository.findById(1L)).thenReturn(Optional.of(activeMission));
        when(satelliteRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> incidentService.create(1L, request, "admin@finalspace.com")
        );

        assertEquals("Satellite introuvable", exception.getMessage());

        verify(incidentRepository, never()).save(any());
    }

    @Test
    void shouldRejectCreateIncidentWhenSatelliteBelongsToAnotherMission() {
        IncidentCreateRequest request = new IncidentCreateRequest(
                11L,
                null,
                "Incident",
                "Description",
                null,
                IncidentSeverity.MOYENNE
        );

        when(missionRepository.findById(1L)).thenReturn(Optional.of(activeMission));
        when(satelliteRepository.findById(11L)).thenReturn(Optional.of(otherMissionSatellite));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> incidentService.create(1L, request, "admin@finalspace.com")
        );

        assertEquals("Le satellite n'appartient pas à la mission", exception.getMessage());

        verify(incidentRepository, never()).save(any());
    }

    @Test
    void shouldCreateIncidentLinkedToAlert() {
        IncidentCreateRequest request = new IncidentCreateRequest(
                10L,
                100L,
                "Incident depuis alerte",
                "Créé depuis une alerte thermique",
                "Analyse",
                IncidentSeverity.ELEVEE
        );

        when(missionRepository.findById(1L)).thenReturn(Optional.of(activeMission));
        when(satelliteRepository.findById(10L)).thenReturn(Optional.of(satellite));
        when(alertRepository.findById(100L)).thenReturn(Optional.of(alert));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
            Incident incident = invocation.getArgument(0);
            incident.setId(203L);
            return incident;
        });

        IncidentResponse response = incidentService.create(1L, request, "operator@finalspace.com");

        assertEquals(203L, response.id());
        assertEquals(100L, response.alertId());
        assertEquals(10L, response.satelliteId());
        assertEquals(IncidentStatus.OUVERT, response.status());
        assertEquals("operator@finalspace.com", response.createdBy());

        verify(incidentRepository).save(any(Incident.class));
    }

    @Test
    void shouldRejectCreateIncidentWhenAlertDoesNotExist() {
        IncidentCreateRequest request = new IncidentCreateRequest(
                null,
                999L,
                "Incident depuis alerte",
                "Description",
                null,
                IncidentSeverity.MOYENNE
        );

        when(missionRepository.findById(1L)).thenReturn(Optional.of(activeMission));
        when(alertRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> incidentService.create(1L, request, "admin@finalspace.com")
        );

        assertEquals("Alerte introuvable", exception.getMessage());

        verify(incidentRepository, never()).save(any());
    }

    @Test
    void shouldReturnIncidentsByMission() {
        when(missionRepository.existsById(1L)).thenReturn(true);
        when(incidentRepository.findByMissionIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(openIncident, inProgressIncident));

        List<IncidentResponse> responses = incidentService.findByMission(1L, null);

        assertEquals(2, responses.size());
        assertEquals("Incident thermique", responses.get(0).title());
        assertEquals("Incident en cours", responses.get(1).title());

        verify(incidentRepository).findByMissionIdOrderByCreatedAtDesc(1L);
    }

    @Test
    void shouldReturnIncidentsByMissionAndStatus() {
        when(missionRepository.existsById(1L)).thenReturn(true);
        when(incidentRepository.findByMissionIdAndStatusOrderByCreatedAtDesc(1L, IncidentStatus.OUVERT))
                .thenReturn(List.of(openIncident));

        List<IncidentResponse> responses = incidentService.findByMission(1L, IncidentStatus.OUVERT);

        assertEquals(1, responses.size());
        assertEquals(IncidentStatus.OUVERT, responses.get(0).status());

        verify(incidentRepository).findByMissionIdAndStatusOrderByCreatedAtDesc(1L, IncidentStatus.OUVERT);
    }

    @Test
    void shouldRejectFindByMissionWhenMissionDoesNotExist() {
        when(missionRepository.existsById(99L)).thenReturn(false);

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> incidentService.findByMission(99L, null)
        );

        assertEquals("Mission introuvable", exception.getMessage());

        verify(incidentRepository, never()).findByMissionIdOrderByCreatedAtDesc(anyLong());
    }

    @Test
    void shouldReturnIncidentById() {
        when(incidentRepository.findById(200L)).thenReturn(Optional.of(openIncident));

        IncidentResponse response = incidentService.findById(200L);

        assertEquals(200L, response.id());
        assertEquals("Incident thermique", response.title());
        assertEquals(IncidentStatus.OUVERT, response.status());
        assertEquals(100L, response.alertId());
    }

    @Test
    void shouldRejectFindByIdWhenIncidentDoesNotExist() {
        when(incidentRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> incidentService.findById(999L)
        );

        assertEquals("Incident introuvable", exception.getMessage());
    }

    @Test
    void shouldUpdateOpenIncident() {
        IncidentUpdateRequest request = new IncidentUpdateRequest(
                "Incident modifié",
                "Description modifiée",
                "Notes modifiées",
                IncidentSeverity.MOYENNE
        );

        when(incidentRepository.findById(200L)).thenReturn(Optional.of(openIncident));
        when(incidentRepository.save(openIncident)).thenReturn(openIncident);

        IncidentResponse response = incidentService.update(200L, request);

        assertEquals("Incident modifié", response.title());
        assertEquals("Description modifiée", response.description());
        assertEquals("Notes modifiées", response.notes());
        assertEquals(IncidentSeverity.MOYENNE, response.severity());

        verify(incidentRepository).save(openIncident);
    }

    @Test
    void shouldRejectUpdateClosedIncident() {
        IncidentUpdateRequest request = new IncidentUpdateRequest(
                "Modification interdite",
                "Description",
                null,
                IncidentSeverity.FAIBLE
        );

        when(incidentRepository.findById(202L)).thenReturn(Optional.of(closedIncident));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> incidentService.update(202L, request)
        );

        assertEquals("Incident clôturé non modifiable", exception.getMessage());

        verify(incidentRepository, never()).save(any());
    }

    @Test
    void shouldMoveFromOpenToInProgress() {
        when(incidentRepository.findById(200L)).thenReturn(Optional.of(openIncident));
        when(incidentRepository.save(openIncident)).thenReturn(openIncident);

        IncidentResponse response = incidentService.updateStatus(200L, IncidentStatus.EN_COURS);

        assertEquals(IncidentStatus.EN_COURS, response.status());
        assertNull(response.closedAt());

        verify(incidentRepository).save(openIncident);
    }

    @Test
    void shouldMoveFromInProgressToClosed() {
        when(incidentRepository.findById(201L)).thenReturn(Optional.of(inProgressIncident));
        when(incidentRepository.save(inProgressIncident)).thenReturn(inProgressIncident);

        IncidentResponse response = incidentService.updateStatus(201L, IncidentStatus.CLOTURE);

        assertEquals(IncidentStatus.CLOTURE, response.status());
        assertNotNull(response.closedAt());

        verify(incidentRepository).save(inProgressIncident);
    }

    @Test
    void shouldCloseOpenIncidentDirectly() {
        when(incidentRepository.findById(200L)).thenReturn(Optional.of(openIncident));
        when(incidentRepository.save(openIncident)).thenReturn(openIncident);

        IncidentResponse response = incidentService.close(200L);

        assertEquals(IncidentStatus.CLOTURE, response.status());
        assertNotNull(response.closedAt());

        verify(incidentRepository).save(openIncident);
    }

    @Test
    void shouldRejectInvalidStatusTransition() {
        when(incidentRepository.findById(201L)).thenReturn(Optional.of(inProgressIncident));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> incidentService.updateStatus(201L, IncidentStatus.OUVERT)
        );

        assertEquals("Transition de statut invalide", exception.getMessage());

        verify(incidentRepository, never()).save(any());
    }

    @Test
    void shouldRejectStatusUpdateWhenIncidentIsClosed() {
        when(incidentRepository.findById(202L)).thenReturn(Optional.of(closedIncident));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> incidentService.updateStatus(202L, IncidentStatus.EN_COURS)
        );

        assertEquals("Incident clôturé non modifiable", exception.getMessage());

        verify(incidentRepository, never()).save(any());
    }

    @Test
    void shouldRejectUpdateIncidentWhenMissionIsClosed() {
        IncidentUpdateRequest request = new IncidentUpdateRequest(
                "Modification interdite",
                "Mission clôturée",
                null,
                IncidentSeverity.FAIBLE
        );

        when(incidentRepository.findById(203L)).thenReturn(Optional.of(openIncidentOnClosedMission));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> incidentService.update(203L, request)
        );

        assertEquals("Incident non modifiable car la mission est clôturée", exception.getMessage());

        verify(incidentRepository, never()).save(any());
    }

    @Test
    void shouldRejectStatusUpdateWhenMissionIsClosed() {
        when(incidentRepository.findById(203L)).thenReturn(Optional.of(openIncidentOnClosedMission));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> incidentService.updateStatus(203L, IncidentStatus.EN_COURS)
        );

        assertEquals("Incident non modifiable car la mission est clôturée", exception.getMessage());

        verify(incidentRepository, never()).save(any());
    }
}