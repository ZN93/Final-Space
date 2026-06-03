package com.finalspace.backend.mission.service.impl;

import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.mission.dto.MissionCreateRequest;
import com.finalspace.backend.mission.dto.MissionResponse;
import com.finalspace.backend.mission.dto.MissionUpdateRequest;
import com.finalspace.backend.mission.service.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MissionServiceImpl implements MissionService {

    private final MissionRepository missionRepository;

    @Override
    public MissionResponse create(MissionCreateRequest request) {
        Mission mission = Mission.builder()
                .name(request.name())
                .description(request.description())
                .status(MissionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(missionRepository.save(mission));
    }

    @Override
    public List<MissionResponse> findAll() {
        return missionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public MissionResponse findById(Long id) {
        Mission mission = getMissionOrThrow(id);

        return toResponse(mission);
    }

    @Override
    public MissionResponse update(Long id, MissionUpdateRequest request) {
        Mission mission = getMissionOrThrow(id);

        if (mission.getStatus() == MissionStatus.CLOTUREE) {
            throw new BusinessException(
                    "Une mission clôturée ne peut pas être modifiée"
            );
        }

        mission.setName(request.name());
        mission.setDescription(request.description());

        return toResponse(missionRepository.save(mission));
    }

    @Override
    public MissionResponse close(Long id) {
        Mission mission = getMissionOrThrow(id);

        if (mission.getStatus() == MissionStatus.CLOTUREE) {
            return toResponse(mission);
        }

        mission.setStatus(MissionStatus.CLOTUREE);
        mission.setClosedAt(LocalDateTime.now());

        return toResponse(missionRepository.save(mission));
    }

    private Mission getMissionOrThrow(Long id) {
        return missionRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Mission introuvable")
                );
    }

    private MissionResponse toResponse(Mission mission) {
        return new MissionResponse(
                mission.getId(),
                mission.getName(),
                mission.getDescription(),
                mission.getStatus(),
                mission.getCreatedAt(),
                mission.getClosedAt()
        );
    }
}