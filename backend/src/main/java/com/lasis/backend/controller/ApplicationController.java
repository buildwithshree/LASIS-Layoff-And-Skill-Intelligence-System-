package com.lasis.backend.controller;

import com.lasis.backend.model.Application;
import com.lasis.backend.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/apply/{studentId}/{jobId}")
    public ResponseEntity<?> applyToJob(@PathVariable Integer studentId,
                                         @PathVariable Integer jobId) {
        try {
            return ResponseEntity.ok(applicationService.applyToJob(studentId, jobId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/student/{studentId}")
    public List<Application> getApplicationsByStudent(@PathVariable Integer studentId) {
        return applicationService.getApplicationsByStudent(studentId);
    }

    @GetMapping("/job/{jobId}")
    public List<Application> getApplicationsByJob(@PathVariable Integer jobId) {
        return applicationService.getApplicationsByJob(jobId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> getApplicationById(@PathVariable Integer id) {
        return applicationService.getApplicationById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{applicationId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer applicationId,
                                           @RequestParam String status) {
        try {
            return ResponseEntity.ok(applicationService.updateApplicationStatus(applicationId, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/status/{status}")
    public List<Application> getApplicationsByStatus(@PathVariable String status) {
        return applicationService.getApplicationsByStatus(status);
    }
}