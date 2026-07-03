package com.finalspace.backend.telemetry.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.common.exception.ResourceNotFoundException;
import com.finalspace.backend.mission.Mission;
import com.finalspace.backend.mission.MissionStatus;
import com.finalspace.backend.satellite.Satellite;
import com.finalspace.backend.satellite.SatelliteRepository;
import com.finalspace.backend.satellite.SatelliteStatus;
import com.finalspace.backend.telemetry.TelemetryImportException;
import com.finalspace.backend.telemetry.TelemetryPoint;
import com.finalspace.backend.telemetry.TelemetryPointRepository;
import com.finalspace.backend.telemetry.dto.TelemetryImportResponse;
import com.finalspace.backend.telemetry.anomaly.service.TelemetryAnomalyDetectionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TelemetryImportServiceImplTest {

    @Mock
    private SatelliteRepository satelliteRepository;

    @Mock
    private TelemetryPointRepository telemetryPointRepository;

    @Mock
    private TelemetryAnomalyDetectionService telemetryAnomalyDetectionService;

    @InjectMocks
    private TelemetryImportServiceImpl telemetryImportService;

    @Test
    void shouldImportValidCsvAndPersistTelemetryPoints() {
        Satellite satellite = activeSatellite();

        MockMultipartFile file = csvFile(
                "telemetry-valid.csv",
                """
                timestamp,metric,value
                2026-01-01T10:00:00Z,temperature,42.5
                2026-01-01T10:00:00Z,battery,78
                """
        );

        when(satelliteRepository.findByIdWithMission(3L)).thenReturn(Optional.of(satellite));
        when(telemetryPointRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        TelemetryImportResponse response = telemetryImportService.importCsv(4L, 3L, file);

        assertThat(response.importId()).isNotBlank();
        assertThat(response.importedCount()).isEqualTo(2);
        assertThat(response.errorCount()).isZero();
        assertThat(response.errors()).isEmpty();

        ArgumentCaptor<List<TelemetryPoint>> captor = ArgumentCaptor.forClass(List.class);
        verify(telemetryPointRepository).saveAll(captor.capture());

        List<TelemetryPoint> savedPoints = captor.getValue();

        assertThat(savedPoints).hasSize(2);

        assertThat(savedPoints.get(0).getMissionId()).isEqualTo(4L);
        assertThat(savedPoints.get(0).getSatelliteId()).isEqualTo(3L);
        assertThat(savedPoints.get(0).getTimestamp()).isEqualTo(Instant.parse("2026-01-01T10:00:00Z"));
        assertThat(savedPoints.get(0).getMetric()).isEqualTo("temperature");
        assertThat(savedPoints.get(0).getValue()).isEqualTo(42.5);
        assertThat(savedPoints.get(0).getSourceImportId()).isEqualTo(response.importId());

        assertThat(savedPoints.get(1).getMetric()).isEqualTo("battery");
        assertThat(savedPoints.get(1).getValue()).isEqualTo(78.0);
        assertThat(savedPoints.get(1).getSourceImportId()).isEqualTo(response.importId());

        verify(telemetryAnomalyDetectionService).detectAnomalies(
                eq(3L),
                anyList(),
                any(Instant.class),
                any(Instant.class)
        );
    }

    @Test
    void shouldRejectCsvWithInvalidHeaderAndNotPersistAnything() {
        Satellite satellite = activeSatellite();

        MockMultipartFile file = csvFile(
                "telemetry-invalid.csv",
                """
                date,metric,value
                2026-01-01T10:00:00Z,temperature,42.5
                """
        );

        when(satelliteRepository.findByIdWithMission(3L)).thenReturn(Optional.of(satellite));

        assertThatThrownBy(() -> telemetryImportService.importCsv(4L, 3L, file))
                .isInstanceOf(TelemetryImportException.class)
                .satisfies(exception -> {
                    TelemetryImportException importException = (TelemetryImportException) exception;

                    assertThat(importException.getErrors()).hasSize(1);
                    assertThat(importException.getErrors().get(0).line()).isEqualTo(1);
                    assertThat(importException.getErrors().get(0).message())
                            .isEqualTo("Header CSV invalide. Format attendu : timestamp,metric,value");
                });

        verify(telemetryPointRepository, never()).saveAll(anyList());
    }

    @Test
    void shouldRejectCsvWithInvalidRowsAndNotPersistAnything() {
        Satellite satellite = activeSatellite();

        MockMultipartFile file = csvFile(
                "telemetry-invalid.csv",
                """
                timestamp,metric,value
                2026-01-01T10:00:00Z,temperature,42.5
                date-invalide,battery,78
                2026-01-01T10:05:00Z,,91
                2026-01-01T10:10:00Z,speed,abc
                """
        );

        when(satelliteRepository.findByIdWithMission(3L)).thenReturn(Optional.of(satellite));

        assertThatThrownBy(() -> telemetryImportService.importCsv(4L, 3L, file))
                .isInstanceOf(TelemetryImportException.class)
                .satisfies(exception -> {
                    TelemetryImportException importException = (TelemetryImportException) exception;

                    assertThat(importException.getErrors()).hasSize(3);

                    assertThat(importException.getErrors().get(0).line()).isEqualTo(3);
                    assertThat(importException.getErrors().get(0).message())
                            .isEqualTo("Timestamp invalide. Format attendu : ISO-8601, exemple 2026-01-01T10:00:00Z");

                    assertThat(importException.getErrors().get(1).line()).isEqualTo(4);
                    assertThat(importException.getErrors().get(1).message())
                            .isEqualTo("La métrique est obligatoire");

                    assertThat(importException.getErrors().get(2).line()).isEqualTo(5);
                    assertThat(importException.getErrors().get(2).message())
                            .isEqualTo("La valeur doit être numérique");
                });

        verify(telemetryPointRepository, never()).saveAll(anyList());
    }

    @Test
    void shouldSupportUtf8BomInCsvHeader() {
        Satellite satellite = activeSatellite();

        MockMultipartFile file = csvFile(
                "telemetry-valid.csv",
                "\uFEFFtimestamp,metric,value\n" +
                        "2026-01-01T10:00:00Z,temperature,42.5\n"
        );

        when(satelliteRepository.findByIdWithMission(3L)).thenReturn(Optional.of(satellite));
        when(telemetryPointRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        TelemetryImportResponse response = telemetryImportService.importCsv(4L, 3L, file);

        assertThat(response.importedCount()).isEqualTo(1);
        assertThat(response.errorCount()).isZero();

        verify(telemetryPointRepository).saveAll(anyList());

        verify(telemetryAnomalyDetectionService).detectAnomalies(
                eq(3L),
                anyList(),
                any(Instant.class),
                any(Instant.class)
        );
    }

    @Test
    void shouldRejectEmptyCsvFile() {
        Satellite satellite = activeSatellite();

        MockMultipartFile file = csvFile(
                "telemetry-empty.csv",
                ""
        );

        when(satelliteRepository.findByIdWithMission(3L)).thenReturn(Optional.of(satellite));

        assertThatThrownBy(() -> telemetryImportService.importCsv(4L, 3L, file))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Le fichier CSV est obligatoire");

        verify(telemetryPointRepository, never()).saveAll(anyList());
    }

    @Test
    void shouldRejectNonCsvFile() {
        Satellite satellite = activeSatellite();

        MockMultipartFile file = csvFile(
                "telemetry.txt",
                """
                timestamp,metric,value
                2026-01-01T10:00:00Z,temperature,42.5
                """
        );

        when(satelliteRepository.findByIdWithMission(3L)).thenReturn(Optional.of(satellite));

        assertThatThrownBy(() -> telemetryImportService.importCsv(4L, 3L, file))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Le fichier doit être au format CSV");

        verify(telemetryPointRepository, never()).saveAll(anyList());
    }

    @Test
    void shouldRejectUnknownSatellite() {
        MockMultipartFile file = csvFile(
                "telemetry-valid.csv",
                """
                timestamp,metric,value
                2026-01-01T10:00:00Z,temperature,42.5
                """
        );

        when(satelliteRepository.findByIdWithMission(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> telemetryImportService.importCsv(4L, 99L, file))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Satellite introuvable");

        verify(telemetryPointRepository, never()).saveAll(anyList());
    }

    @Test
    void shouldRejectSatelliteThatDoesNotBelongToMission() {
        Satellite satellite = activeSatellite();

        MockMultipartFile file = csvFile(
                "telemetry-valid.csv",
                """
                timestamp,metric,value
                2026-01-01T10:00:00Z,temperature,42.5
                """
        );

        when(satelliteRepository.findByIdWithMission(3L)).thenReturn(Optional.of(satellite));

        assertThatThrownBy(() -> telemetryImportService.importCsv(999L, 3L, file))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Le satellite n'appartient pas à la mission indiquée");

        verify(telemetryPointRepository, never()).saveAll(anyList());
    }

    @Test
    void shouldRejectInactiveSatellite() {
        Satellite satellite = satelliteWithStatus(SatelliteStatus.INACTIF, MissionStatus.ACTIVE);

        MockMultipartFile file = csvFile(
                "telemetry-valid.csv",
                """
                timestamp,metric,value
                2026-01-01T10:00:00Z,temperature,42.5
                """
        );

        when(satelliteRepository.findByIdWithMission(3L)).thenReturn(Optional.of(satellite));

        assertThatThrownBy(() -> telemetryImportService.importCsv(4L, 3L, file))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Le satellite doit être actif pour importer des données de télémétrie");

        verify(telemetryPointRepository, never()).saveAll(anyList());
    }

    @Test
    void shouldRejectClosedMission() {
        Satellite satellite = satelliteWithStatus(SatelliteStatus.ACTIF, MissionStatus.CLOTUREE);

        MockMultipartFile file = csvFile(
                "telemetry-valid.csv",
                """
                timestamp,metric,value
                2026-01-01T10:00:00Z,temperature,42.5
                """
        );

        when(satelliteRepository.findByIdWithMission(3L)).thenReturn(Optional.of(satellite));

        assertThatThrownBy(() -> telemetryImportService.importCsv(4L, 3L, file))
                .isInstanceOf(BusinessException.class)
                .hasMessage("La mission est clôturée");

        verify(telemetryPointRepository, never()).saveAll(anyList());
    }

    private MockMultipartFile csvFile(String filename, String content) {
        return new MockMultipartFile(
                "file",
                filename,
                "text/csv",
                content.getBytes(StandardCharsets.UTF_8)
        );
    }

    private Satellite activeSatellite() {
        return satelliteWithStatus(SatelliteStatus.ACTIF, MissionStatus.ACTIVE);
    }

    private Satellite satelliteWithStatus(SatelliteStatus satelliteStatus, MissionStatus missionStatus) {
        Mission mission = Mission.builder()
                .id(4L)
                .name("Mission to the MOOOOON")
                .status(missionStatus)
                .build();

        return Satellite.builder()
                .id(3L)
                .name("LunaSat-03")
                .status(satelliteStatus)
                .mission(mission)
                .build();
    }
}