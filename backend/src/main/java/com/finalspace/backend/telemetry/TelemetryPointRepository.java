package com.finalspace.backend.telemetry;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TelemetryPointRepository extends MongoRepository<TelemetryPoint, String> {

    List<TelemetryPoint> findBySatelliteIdOrderByTimestampDesc(Long satelliteId);

    List<TelemetryPoint> findBySatelliteIdAndMetricOrderByTimestampAsc(Long satelliteId, String metric);
}