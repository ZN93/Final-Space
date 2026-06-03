package com.finalspace.backend.mission.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.mission.dto.MissionCreateRequest;
import com.finalspace.backend.mission.dto.MissionResponse;
import com.finalspace.backend.mission.dto.MissionUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MissionServiceImplTest {

    @Mock
    private MissionRepository missionRepository;

    @InjectMocks
    private MissionServiceImpl missionService;

    private Mission activeMission;

    @BeforeEach
    void setUp() {
        activeMission = Mission.builder()
                .id(1L)
                .name("Mission Artemis")
                .description("Mission lunaire")
                .status(MissionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .closedAt(null)
                .build();
    }

    @Test
    void shouldCreateActiveMission() {
        MissionCreateRequest request =
                new MissionCreateRequest("Mission Artemis", "Mission lunaire");

        when(missionRepository.save(any(Mission.class)))
                .thenAnswer(invocation -> {
                    Mission mission = invocation.getArgument(0);
                    mission.setId(1L);
                    return mission;
                });

        MissionResponse response = missionService.create(request);

        ArgumentCaptor<Mission> captor = ArgumentCaptor.forClass(Mission.class);
        verify(missionRepository).save(captor.capture());

        Mission savedMission = captor.getValue();

        assertEquals("Mission Artemis", response.name());
        assertEquals("Mission lunaire", response.description());
        assertEquals(MissionStatus.ACTIVE, response.status());
        assertNotNull(response.createdAt());
        assertNull(response.closedAt());

        assertEquals(MissionStatus.ACTIVE, savedMission.getStatus());
        assertNotNull(savedMission.getCreatedAt());
    }

    @Test
    void shouldReturnAllMissions() {
        Mission secondMission = Mission.builder()
                .id(2L)
                .name("Mission Europa")
                .description("Exploration")
                .status(MissionStatus.CLOTUREE)
                .createdAt(LocalDateTime.now())
                .closedAt(LocalDateTime.now())
                .build();

        when(missionRepository.findAll())
                .thenReturn(List.of(activeMission, secondMission));

        List<MissionResponse> responses = missionService.findAll();

        assertEquals(2, responses.size());
        assertEquals("Mission Artemis", responses.get(0).name());
        assertEquals("Mission Europa", responses.get(1).name());

        verify(missionRepository).findAll();
    }

    @Test
    void shouldReturnMissionByIdWhenMissionExists() {
        when(missionRepository.findById(1L))
                .thenReturn(Optional.of(activeMission));

        MissionResponse response = missionService.findById(1L);

        assertEquals(1L, response.id());
        assertEquals("Mission Artemis", response.name());
        assertEquals(MissionStatus.ACTIVE, response.status());

        verify(missionRepository).findById(1L);
    }

    @Test
    void shouldThrowResourceNotFoundExceptionWhenMissionDoesNotExist() {
        when(missionRepository.findById(99L))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> missionService.findById(99L)
        );

        assertEquals("Mission introuvable", exception.getMessage());

        verify(missionRepository).findById(99L);
    }

    @Test
    void shouldUpdateActiveMission() {
        MissionUpdateRequest request =
                new MissionUpdateRequest("Mission Artemis II", "Description modifiée");

        when(missionRepository.findById(1L))
                .thenReturn(Optional.of(activeMission));

        when(missionRepository.save(activeMission))
                .thenReturn(activeMission);

        MissionResponse response = missionService.update(1L, request);

        assertEquals("Mission Artemis II", response.name());
        assertEquals("Description modifiée", response.description());
        assertEquals(MissionStatus.ACTIVE, response.status());

        verify(missionRepository).findById(1L);
        verify(missionRepository).save(activeMission);
    }

    @Test
    void shouldRejectUpdateWhenMissionIsClosed() {
        Mission closedMission = Mission.builder()
                .id(1L)
                .name("Mission Artemis")
                .description("Mission lunaire")
                .status(MissionStatus.CLOTUREE)
                .createdAt(LocalDateTime.now())
                .closedAt(LocalDateTime.now())
                .build();

        MissionUpdateRequest request =
                new MissionUpdateRequest("Mission modifiée", "Description modifiée");

        when(missionRepository.findById(1L))
                .thenReturn(Optional.of(closedMission));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> missionService.update(1L, request)
        );

        assertEquals(
                "Une mission clôturée ne peut pas être modifiée",
                exception.getMessage()
        );

        verify(missionRepository, never()).save(any(Mission.class));
    }

    @Test
    void shouldCloseActiveMission() {
        when(missionRepository.findById(1L))
                .thenReturn(Optional.of(activeMission));

        when(missionRepository.save(activeMission))
                .thenReturn(activeMission);

        MissionResponse response = missionService.close(1L);

        assertEquals(MissionStatus.CLOTUREE, response.status());
        assertNotNull(response.closedAt());

        verify(missionRepository).findById(1L);
        verify(missionRepository).save(activeMission);
    }

    @Test
    void shouldReturnClosedMissionWithoutSavingAgainWhenAlreadyClosed() {
        Mission closedMission = Mission.builder()
                .id(1L)
                .name("Mission Artemis")
                .description("Mission lunaire")
                .status(MissionStatus.CLOTUREE)
                .createdAt(LocalDateTime.now())
                .closedAt(LocalDateTime.now())
                .build();

        when(missionRepository.findById(1L))
                .thenReturn(Optional.of(closedMission));

        MissionResponse response = missionService.close(1L);

        assertEquals(MissionStatus.CLOTUREE, response.status());
        assertNotNull(response.closedAt());

        verify(missionRepository).findById(1L);
        verify(missionRepository, never()).save(any(Mission.class));
    }
}