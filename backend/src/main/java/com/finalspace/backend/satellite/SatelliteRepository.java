package com.finalspace.backend.satellite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface SatelliteRepository extends JpaRepository<Satellite, Long> {

    List<Satellite> findByMissionId(Long missionId);

    long countByMissionId(Long missionId);

    long countByMissionIdAndStatus(Long missionId, SatelliteStatus status);

    @EntityGraph(attributePaths = "mission")
    @Query("select s from Satellite s where s.id = :id")
    Optional<Satellite> findByIdWithMission(@Param("id") Long id);


}