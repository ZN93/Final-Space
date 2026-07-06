package com.finalspace.backend.simulation.export;

import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.simulation.SimulationRun;
import com.finalspace.backend.simulation.SimulationRunRepository;
import com.finalspace.backend.simulation.SimulationType;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SimulationExportServiceImpl implements SimulationExportService {

    private final SimulationRunRepository simulationRunRepository;

    @Override
    public byte[] generateSimulationCsv(Long simulationId) {
        SimulationRun run = getSimulationRun(simulationId);

        StringBuilder csv = new StringBuilder();

        csv.append("simulationId;")
                .append("missionId;")
                .append("missionName;")
                .append("satelliteId;")
                .append("satelliteName;")
                .append("type;")
                .append("status;")
                .append("createdAt;")
                .append("createdBy;")
                .append("inputMassKg;")
                .append("inputAltitudeKm;")
                .append("inputInclinationDeg;")
                .append("inputEccentricity;")
                .append("targetAltitudeKm;")
                .append("orbitalPeriodMinutes;")
                .append("averageVelocityKmS;")
                .append("orbitShape;")
                .append("deltaV1MS;")
                .append("deltaV2MS;")
                .append("deltaVTotalMS;")
                .append("transferTimeMinutes")
                .append("\r\n");

        csv.append(csvValue(run.getId())).append(';')
                .append(csvValue(run.getMission().getId())).append(';')
                .append(csvValue(run.getMission().getName())).append(';')
                .append(csvValue(run.getSatellite().getId())).append(';')
                .append(csvValue(run.getSatellite().getName())).append(';')
                .append(csvValue(run.getType())).append(';')
                .append(csvValue(run.getStatus())).append(';')
                .append(csvValue(run.getCreatedAt())).append(';')
                .append(csvValue(run.getCreatedBy())).append(';')
                .append(csvValue(run.getInputMassKg())).append(';')
                .append(csvValue(run.getInputAltitudeKm())).append(';')
                .append(csvValue(run.getInputInclinationDeg())).append(';')
                .append(csvValue(run.getInputEccentricity())).append(';')
                .append(csvValue(run.getTargetAltitudeKm())).append(';')
                .append(csvValue(run.getOrbitalPeriodMinutes())).append(';')
                .append(csvValue(run.getAverageVelocityKmS())).append(';')
                .append(csvValue(run.getOrbitShape())).append(';')
                .append(csvValue(run.getDeltaV1MS())).append(';')
                .append(csvValue(run.getDeltaV2MS())).append(';')
                .append(csvValue(run.getDeltaVTotalMS())).append(';')
                .append(csvValue(run.getTransferTimeMinutes()))
                .append("\r\n");

        return ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public byte[] generateSimulationPdf(Long simulationId) {
        SimulationRun run = getSimulationRun(simulationId);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(document, outputStream);

            document.open();

            Paragraph title = new Paragraph(
                    "Final Space - Rapport de simulation",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)
            );
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            Paragraph generationDate = new Paragraph(
                    "Date de génération : " + LocalDateTime.now(),
                    FontFactory.getFont(FontFactory.HELVETICA, 10)
            );
            generationDate.setSpacingAfter(20);
            document.add(generationDate);

            addSectionTitle(document, "Métadonnées");
            PdfPTable metadataTable = createTable();
            addTableHeader(metadataTable, "Champ", "Valeur", "Unité");
            addTableRow(metadataTable, "Simulation ID", run.getId(), "");
            addTableRow(metadataTable, "Mission", run.getMission().getName() + " (#" + run.getMission().getId() + ")", "");
            addTableRow(metadataTable, "Satellite", run.getSatellite().getName() + " (#" + run.getSatellite().getId() + ")", "");
            addTableRow(metadataTable, "Type", run.getType(), "");
            addTableRow(metadataTable, "Statut", run.getStatus(), "");
            addTableRow(metadataTable, "Créée le", run.getCreatedAt(), "");
            addTableRow(metadataTable, "Créée par", run.getCreatedBy(), "");
            document.add(metadataTable);

            addSectionTitle(document, "Paramètres d'entrée");
            PdfPTable inputsTable = createTable();
            addTableHeader(inputsTable, "Paramètre", "Valeur", "Unité");
            addTableRow(inputsTable, "Masse", run.getInputMassKg(), "kg");
            addTableRow(inputsTable, "Altitude initiale", run.getInputAltitudeKm(), "km");
            addTableRow(inputsTable, "Inclinaison", run.getInputInclinationDeg(), "deg");
            addTableRow(inputsTable, "Excentricité", run.getInputEccentricity(), "");

            if (run.getType() == SimulationType.HOHMANN) {
                addTableRow(inputsTable, "Altitude cible", run.getTargetAltitudeKm(), "km");
            }

            document.add(inputsTable);

            addSectionTitle(document, "Résultats");
            PdfPTable resultsTable = createTable();
            addTableHeader(resultsTable, "Résultat", "Valeur", "Unité");

            if (run.getType() == SimulationType.ORBIT) {
                addTableRow(resultsTable, "Période orbitale", run.getOrbitalPeriodMinutes(), "min");
                addTableRow(resultsTable, "Vitesse moyenne", run.getAverageVelocityKmS(), "km/s");
                addTableRow(resultsTable, "Forme de l'orbite", run.getOrbitShape(), "");
            }

            if (run.getType() == SimulationType.HOHMANN) {
                addTableRow(resultsTable, "Delta V1", run.getDeltaV1MS(), "m/s");
                addTableRow(resultsTable, "Delta V2", run.getDeltaV2MS(), "m/s");
                addTableRow(resultsTable, "Delta V total", run.getDeltaVTotalMS(), "m/s");
                addTableRow(resultsTable, "Durée du transfert", run.getTransferTimeMinutes(), "min");
            }

            document.add(resultsTable);

            Paragraph footer = new Paragraph(
                    "Rapport généré automatiquement par Final Space. Les données exportées correspondent à la simulation sélectionnée et ne modifient pas les données en base.",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9)
            );
            footer.setSpacingBefore(24);
            document.add(footer);

            document.close();

            return outputStream.toByteArray();
        } catch (DocumentException exception) {
            throw new IllegalStateException("Impossible de générer le rapport PDF de simulation", exception);
        } catch (Exception exception) {
            throw new IllegalStateException("Erreur inattendue pendant la génération du rapport PDF", exception);
        }
    }

    @Override
    public String buildCsvFilename(Long simulationId) {
        return "simulation-" + simulationId + ".csv";
    }

    @Override
    public String buildPdfFilename(Long simulationId) {
        return "simulation-" + simulationId + ".pdf";
    }

    private SimulationRun getSimulationRun(Long simulationId) {
        return simulationRunRepository.findById(simulationId)
                .orElseThrow(() -> new ResourceNotFoundException("Simulation introuvable"));
    }

    private String csvValue(Object value) {
        if (value == null) {
            return "";
        }

        String text = value.toString();

        if (
                text.contains(";")
                        || text.contains("\"")
                        || text.contains("\n")
                        || text.contains("\r")
        ) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }

        return text;
    }

    private void addSectionTitle(Document document, String title) throws DocumentException {
        Paragraph paragraph = new Paragraph(
                title,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)
        );
        paragraph.setSpacingBefore(12);
        paragraph.setSpacingAfter(8);
        document.add(paragraph);
    }

    private PdfPTable createTable() throws DocumentException {
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{35, 45, 20});
        table.setSpacingAfter(12);
        return table;
    }

    private void addTableHeader(
            PdfPTable table,
            String firstColumn,
            String secondColumn,
            String thirdColumn
    ) {
        table.addCell(createHeaderCell(firstColumn));
        table.addCell(createHeaderCell(secondColumn));
        table.addCell(createHeaderCell(thirdColumn));
    }

    private void addTableRow(
            PdfPTable table,
            String name,
            Object value,
            String unit
    ) {
        table.addCell(createBodyCell(name));
        table.addCell(createBodyCell(value == null ? "-" : value.toString()));
        table.addCell(createBodyCell(unit == null ? "" : unit));
    }

    private PdfPCell createHeaderCell(String value) {
        PdfPCell cell = new PdfPCell(new Phrase(
                value,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)
        ));
        cell.setBackgroundColor(new Color(230, 230, 230));
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setPadding(6);
        return cell;
    }

    private PdfPCell createBodyCell(String value) {
        PdfPCell cell = new PdfPCell(new Phrase(
                value,
                FontFactory.getFont(FontFactory.HELVETICA, 10)
        ));
        cell.setPadding(6);
        return cell;
    }
}