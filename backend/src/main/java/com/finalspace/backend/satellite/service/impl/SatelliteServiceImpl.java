package com.finalspace.backend.satellite.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionRepository;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.satellite.dto.SatelliteCreateRequest;
import com.finalspace.backend.satellite.dto.SatelliteResponse;
import com.finalspace.backend.satellite.dto.SatelliteUpdateRequest;
import com.finalspace.backend.satellite.service.SatelliteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SatelliteServiceImpl implements SatelliteService {

    private final SatelliteRepository satelliteRepository;
    private final MissionRepository missionRepository;

    @Override
    public SatelliteResponse create(Long missionId, SatelliteCreateRequest request) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission introuvable"));

        if (mission.getStatus() == MissionStatus.CLOTUREE) {
            throw new BusinessException("Impossible de créer un satellite dans une mission clôturée");
        }

        LocalDateTime now = LocalDateTime.now();

        Satellite satellite = Satellite.builder()
                .name(request.name())
                .massKg(request.massKg())
                .altitudeKm(request.altitudeKm())
                .inclinationDeg(request.inclinationDeg())
                .eccentricity(request.eccentricity())
                .status(SatelliteStatus.ACTIF)
                .createdAt(now)
                .updatedAt(now)
                .mission(mission)
                .build();

        return toResponse(satelliteRepository.save(satellite));
    }

    @Override
    public List<SatelliteResponse> findByMission(Long missionId) {
        if (!missionRepository.existsById(missionId)) {
            throw new ResourceNotFoundException("Mission introuvable");
        }

        return satelliteRepository.findByMissionId(missionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public SatelliteResponse findById(Long id) {
        Satellite satellite = findSatelliteOrThrow(id);
        return toResponse(satellite);
    }

    @Override
    public SatelliteResponse update(Long id, SatelliteUpdateRequest request) {
        Satellite satellite = findSatelliteOrThrow(id);

        if (satellite.getStatus() == SatelliteStatus.INACTIF) {
            throw new BusinessException("Un satellite inactif ne peut pas être modifié");
        }

        satellite.setName(request.name());
        satellite.setMassKg(request.massKg());
        satellite.setAltitudeKm(request.altitudeKm());
        satellite.setInclinationDeg(request.inclinationDeg());
        satellite.setEccentricity(request.eccentricity());
        satellite.setUpdatedAt(LocalDateTime.now());

        return toResponse(satelliteRepository.save(satellite));
    }

    @Override
    public SatelliteResponse disable(Long id) {
        Satellite satellite = findSatelliteOrThrow(id);

        if (satellite.getStatus() == SatelliteStatus.INACTIF) {
            return toResponse(satellite);
        }

        satellite.setStatus(SatelliteStatus.INACTIF);
        satellite.setUpdatedAt(LocalDateTime.now());

        return toResponse(satelliteRepository.save(satellite));
    }

    private Satellite findSatelliteOrThrow(Long id) {
        return satelliteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Satellite introuvable"));
    }

    private SatelliteResponse toResponse(Satellite satellite) {
        Mission mission = satellite.getMission();

        return new SatelliteResponse(
                satellite.getId(),
                satellite.getName(),
                satellite.getStatus(),
                satellite.getMassKg(),
                satellite.getAltitudeKm(),
                satellite.getInclinationDeg(),
                satellite.getEccentricity(),
                satellite.getCreatedAt(),
                satellite.getUpdatedAt(),
                mission.getId(),
                mission.getName()
        );
    }
}