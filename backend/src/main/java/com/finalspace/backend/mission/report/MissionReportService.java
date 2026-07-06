package com.finalspace.backend.mission.report;

public interface MissionReportService {

    byte[] generateMissionReportPdf(Long missionId, String generatedBy);

    String buildReportFilename(Long missionId);
}