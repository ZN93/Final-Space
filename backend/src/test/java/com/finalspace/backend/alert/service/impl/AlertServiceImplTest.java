package com.finalspace.backend.alert.service.impl;

import com.finalspace.backend.alert.Alert;
import com.finalspace.backend.alert.AlertRepository;
import com.finalspace.backend.alert.AlertSeverity;
import com.finalspace.backend.alert.AlertStatus;
import com.finalspace.backend.alert.dto.AlertResponse;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertServiceImplTest {

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private MissionRepository missionRepository;

    @InjectMocks
    private AlertServiceImpl alertService;

    private Mission mission;
    private Satellite satellite;
    private Alert activeAlert;
    private Alert acknowledgedAlert;

    @BeforeEach
    void setUp() {
        mission = Mission.builder()
                .id(1L)
                .name("Mission Artemis")
                .description("Mission active")
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
                .mission(mission)
                .build();

        activeAlert = Alert.builder()
                .id(100L)
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

        acknowledgedAlert = Alert.builder()
                .id(101L)
                .mission(mission)
                .satellite(null)
                .metric("system")
                .type("SYSTEM_EVENT")
                .severity(AlertSeverity.MOYENNE)
                .status(AlertStatus.ACQUITTEE)
                .message("Événement système acquitté")
                .createdAt(LocalDateTime.now().minusHours(1))
                .ackAt(LocalDateTime.now())
                .ackBy("admin@finalspace.com")
                .build();
    }

    @Test
    void shouldReturnAllAlertsForMission() {
        when(missionRepository.existsById(1L)).thenReturn(true);
        when(alertRepository.findByMissionIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(activeAlert, acknowledgedAlert));

        List<AlertResponse> responses = alertService.findByMission(1L, null);

        assertEquals(2, responses.size());

        AlertResponse first = responses.get(0);
        assertEquals(100L, first.id());
        assertEquals(1L, first.missionId());
        assertEquals("Mission Artemis", first.missionName());
        assertEquals(10L, first.satelliteId());
        assertEquals("LunaSat-01", first.satelliteName());
        assertEquals("temperature", first.metric());
        assertEquals("THERMAL_ANOMALY", first.type());
        assertEquals(AlertSeverity.ELEVEE, first.severity());
        assertEquals(AlertStatus.ACTIVE, first.status());
        assertEquals("Température satellite supérieure au seuil", first.message());
        assertNull(first.ackAt());
        assertNull(first.ackBy());

        AlertResponse second = responses.get(1);
        assertEquals(101L, second.id());
        assertNull(second.satelliteId());
        assertNull(second.satelliteName());
        assertEquals(AlertStatus.ACQUITTEE, second.status());
        assertEquals("admin@finalspace.com", second.ackBy());

        verify(missionRepository).existsById(1L);
        verify(alertRepository).findByMissionIdOrderByCreatedAtDesc(1L);
        verify(alertRepository, never()).findByMissionIdAndStatusOrderByCreatedAtDesc(anyLong(), any());
    }

    @Test
    void shouldReturnOnlyActiveAlertsForMission() {
        when(missionRepository.existsById(1L)).thenReturn(true);
        when(alertRepository.findByMissionIdAndStatusOrderByCreatedAtDesc(1L, AlertStatus.ACTIVE))
                .thenReturn(List.of(activeAlert));

        List<AlertResponse> responses = alertService.findByMission(1L, AlertStatus.ACTIVE);

        assertEquals(1, responses.size());
        assertEquals(AlertStatus.ACTIVE, responses.get(0).status());
        assertEquals("THERMAL_ANOMALY", responses.get(0).type());

        verify(alertRepository).findByMissionIdAndStatusOrderByCreatedAtDesc(1L, AlertStatus.ACTIVE);
        verify(alertRepository, never()).findByMissionIdOrderByCreatedAtDesc(anyLong());
    }

    @Test
    void shouldReturnOnlyAcknowledgedAlertsForMission() {
        when(missionRepository.existsById(1L)).thenReturn(true);
        when(alertRepository.findByMissionIdAndStatusOrderByCreatedAtDesc(1L, AlertStatus.ACQUITTEE))
                .thenReturn(List.of(acknowledgedAlert));

        List<AlertResponse> responses = alertService.findByMission(1L, AlertStatus.ACQUITTEE);

        assertEquals(1, responses.size());
        assertEquals(AlertStatus.ACQUITTEE, responses.get(0).status());
        assertEquals("SYSTEM_EVENT", responses.get(0).type());
        assertEquals("admin@finalspace.com", responses.get(0).ackBy());

        verify(alertRepository).findByMissionIdAndStatusOrderByCreatedAtDesc(1L, AlertStatus.ACQUITTEE);
        verify(alertRepository, never()).findByMissionIdOrderByCreatedAtDesc(anyLong());
    }

    @Test
    void shouldReturnEmptyListWhenMissionHasNoAlerts() {
        when(missionRepository.existsById(1L)).thenReturn(true);
        when(alertRepository.findByMissionIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of());

        List<AlertResponse> responses = alertService.findByMission(1L, null);

        assertTrue(responses.isEmpty());

        verify(missionRepository).existsById(1L);
        verify(alertRepository).findByMissionIdOrderByCreatedAtDesc(1L);
    }

    @Test
    void shouldRejectWhenMissionDoesNotExist() {
        when(missionRepository.existsById(99L)).thenReturn(false);

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> alertService.findByMission(99L, null)
        );

        assertEquals("Mission introuvable", exception.getMessage());

        verify(alertRepository, never()).findByMissionIdOrderByCreatedAtDesc(anyLong());
        verify(alertRepository, never()).findByMissionIdAndStatusOrderByCreatedAtDesc(anyLong(), any());
    }

    @Test
    void shouldMapAlertWithoutSatellite() {
        when(missionRepository.existsById(1L)).thenReturn(true);
        when(alertRepository.findByMissionIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(acknowledgedAlert));

        List<AlertResponse> responses = alertService.findByMission(1L, null);

        assertEquals(1, responses.size());

        AlertResponse response = responses.get(0);

        assertEquals(101L, response.id());
        assertEquals(1L, response.missionId());
        assertEquals("Mission Artemis", response.missionName());
        assertNull(response.satelliteId());
        assertNull(response.satelliteName());
        assertEquals("system", response.metric());
        assertEquals("SYSTEM_EVENT", response.type());
        assertEquals(AlertSeverity.MOYENNE, response.severity());
        assertEquals(AlertStatus.ACQUITTEE, response.status());
        assertNotNull(response.ackAt());
        assertEquals("admin@finalspace.com", response.ackBy());
    }

    @Test
    void shouldAcknowledgeActiveAlert() {
        when(alertRepository.findById(100L)).thenReturn(java.util.Optional.of(activeAlert));
        when(alertRepository.save(activeAlert)).thenReturn(activeAlert);

        AlertResponse response = alertService.acknowledge(100L, "admin@finalspace.com");

        assertEquals(100L, response.id());
        assertEquals(AlertStatus.ACQUITTEE, response.status());
        assertNotNull(response.ackAt());
        assertEquals("admin@finalspace.com", response.ackBy());

        verify(alertRepository).findById(100L);
        verify(alertRepository).save(activeAlert);
    }

    @Test
    void shouldRejectAcknowledgementWhenAlertDoesNotExist() {
        when(alertRepository.findById(999L)).thenReturn(java.util.Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> alertService.acknowledge(999L, "admin@finalspace.com")
        );

        assertEquals("Alerte introuvable", exception.getMessage());

        verify(alertRepository).findById(999L);
        verify(alertRepository, never()).save(any());
    }

    @Test
    void shouldRejectAcknowledgementWhenAlertIsAlreadyAcknowledged() {
        when(alertRepository.findById(101L)).thenReturn(java.util.Optional.of(acknowledgedAlert));

        com.finalspace.backend.common.exception.BusinessException exception = assertThrows(
                com.finalspace.backend.common.exception.BusinessException.class,
                () -> alertService.acknowledge(101L, "admin@finalspace.com")
        );

        assertEquals("Alerte déjà acquittée", exception.getMessage());

        verify(alertRepository).findById(101L);
        verify(alertRepository, never()).save(any());
    }
}