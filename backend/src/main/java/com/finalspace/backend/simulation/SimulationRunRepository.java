package com.finalspace.backend.simulation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SimulationRunRepository extends JpaRepository<SimulationRun, Long> {

    List<SimulationRun> findBySatelliteIdOrderByCreatedAtDesc(Long satelliteId);

    List<SimulationRun> findByMissionIdOrderByCreatedAtDesc(Long missionId);
}