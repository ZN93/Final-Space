package com.finalspace.backend.alert;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByMissionIdOrderByCreatedAtDesc(Long missionId);

    List<Alert> findByMissionIdAndStatusOrderByCreatedAtDesc(Long missionId, AlertStatus status);

    long countByMissionIdAndStatus(Long missionId, AlertStatus status);
}