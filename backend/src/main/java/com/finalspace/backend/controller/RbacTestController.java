package com.finalspace.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RbacTestController {

    @GetMapping("/api/rbac/admin")
    public String adminOnly() {
        return "ADMIN OK";
    }

    @GetMapping("/api/rbac/operator")
    public String operatorAccess() {
        return "OPERATOR OK";
    }

    @GetMapping("/api/rbac/reader")
    public String readerAccess() {
        return "READER OK";
    }
}