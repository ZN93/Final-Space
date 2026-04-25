package com.finalspace.backend.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AccessMatrixTestController {

    @GetMapping("/missions")
    public String readMissions() {
        return "MISSIONS READ OK";
    }

    @PostMapping("/missions")
    public String createMission() {
        return "MISSIONS CREATE OK";
    }

    @PutMapping("/missions")
    public String updateMission() {
        return "MISSIONS UPDATE OK";
    }

    @DeleteMapping("/missions")
    public String deleteMission() {
        return "MISSIONS DELETE OK";
    }

    @GetMapping("/users")
    public String readUsers() {
        return "USERS ADMIN OK";
    }

    @PostMapping("/users")
    public String createUser() {
        return "USERS CREATE ADMIN OK";
    }

    @GetMapping("/reports")
    public String readReports() {
        return "REPORTS READ OK";
    }

    @PostMapping("/reports")
    public String createReport() {
        return "REPORTS CREATE OK";
    }

    @GetMapping("/dashboard")
    public String readDashboard() {
        return "DASHBOARD READ OK";
    }
}