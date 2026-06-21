package com.finalspace.backend.simulation.service.impl;

import com.finalspace.backend.common.exception.BusinessException;
import com.finalspace.backend.simulation.dto.HohmannTransferResult;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HohmannTransferServiceImplTest {

    private final HohmannTransferServiceImpl service = new HohmannTransferServiceImpl();

    @Test
    void shouldComputeHohmannTransferForAltitudeIncrease() {
        HohmannTransferResult result = service.simulate(500.0, 800.0);

        assertThat(result.deltaV1MS()).isPositive();
        assertThat(result.deltaV2MS()).isPositive();
        assertThat(result.deltaVTotalMS()).isPositive();
        assertThat(result.transferTimeMinutes()).isPositive();
        assertThat(result.plotDataJson()).contains("initialOrbit");
        assertThat(result.plotDataJson()).contains("targetOrbit");
        assertThat(result.plotDataJson()).contains("transferArc");
    }

    @Test
    void shouldComputeHohmannTransferForAltitudeDecrease() {
        HohmannTransferResult result = service.simulate(800.0, 500.0);

        assertThat(result.deltaV1MS()).isPositive();
        assertThat(result.deltaV2MS()).isPositive();
        assertThat(result.deltaVTotalMS()).isPositive();
        assertThat(result.transferTimeMinutes()).isPositive();
        assertThat(result.plotDataJson()).contains("initialOrbit");
        assertThat(result.plotDataJson()).contains("targetOrbit");
        assertThat(result.plotDataJson()).contains("transferArc");
    }

    @Test
    void shouldRejectNullInitialAltitude() {
        assertThatThrownBy(() -> service.simulate(null, 800.0))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Altitude initiale invalide");
    }

    @Test
    void shouldRejectNegativeInitialAltitude() {
        assertThatThrownBy(() -> service.simulate(-10.0, 800.0))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Altitude initiale invalide");
    }

    @Test
    void shouldRejectNullTargetAltitude() {
        assertThatThrownBy(() -> service.simulate(500.0, null))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Altitude cible invalide");
    }

    @Test
    void shouldRejectNegativeTargetAltitude() {
        assertThatThrownBy(() -> service.simulate(500.0, -100.0))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Altitude cible invalide");
    }

    @Test
    void shouldRejectSameInitialAndTargetAltitude() {
        assertThatThrownBy(() -> service.simulate(500.0, 500.0))
                .isInstanceOf(BusinessException.class)
                .hasMessage("L'altitude cible doit être différente de l'altitude initiale");
    }
}