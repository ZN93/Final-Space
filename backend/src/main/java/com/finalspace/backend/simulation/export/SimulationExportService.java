package com.finalspace.backend.simulation.export;

public interface SimulationExportService {

    byte[] generateSimulationCsv(Long simulationId);

    byte[] generateSimulationPdf(Long simulationId);

    String buildCsvFilename(Long simulationId);

    String buildPdfFilename(Long simulationId);
}