package com.finalspace.backend.incident;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByMissionIdOrderByCreatedAtDesc(Long missionId);

    List<Incident> findByMissionIdAndStatusOrderByCreatedAtDesc(Long missionId, IncidentStatus status);

    long countByMissionIdAndStatus(Long missionId, IncidentStatus status);
}