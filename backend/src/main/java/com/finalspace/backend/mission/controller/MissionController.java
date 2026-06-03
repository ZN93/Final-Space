package com.finalspace.backend.mission.controller;

import com.finalspace.backend.mission.dto.MissionCreateRequest;
import com.finalspace.backend.mission.dto.MissionResponse;
import com.finalspace.backend.mission.dto.MissionUpdateRequest;
import com.finalspace.backend.mission.service.MissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
public class MissionController {

    private final MissionService missionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MissionResponse create(
            @Valid @RequestBody MissionCreateRequest request
    ) {
        return missionService.create(request);
    }

    @GetMapping
    public List<MissionResponse> findAll() {
        return missionService.findAll();
    }

    @GetMapping("/{id}")
    public MissionResponse findById(@PathVariable Long id) {
        return missionService.findById(id);
    }

    @PutMapping("/{id}")
    public MissionResponse update(
            @PathVariable Long id,
            @Valid @RequestBody MissionUpdateRequest request
    ) {
        return missionService.update(id, request);
    }

    @PostMapping("/{id}/close")
    public MissionResponse close(@PathVariable Long id) {
        return missionService.close(id);
    }
}