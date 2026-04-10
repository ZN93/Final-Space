package com.finalspace.backend.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public String health() {
        log.info("Health check endpoint called");
        return "OK";
    }
}