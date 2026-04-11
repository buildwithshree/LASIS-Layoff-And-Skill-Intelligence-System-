package com.lasis.backend.controller;

import com.lasis.backend.dto.ApiResponse;
import com.lasis.backend.dto.ApplicationResponseDTO;
import com.lasis.backend.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ApplicationResponseDTO>>> getAllApplications() {
        return ResponseEntity.ok(ApiResponse.success(
                "Applications fetched successfully",
                applicationService.getAllApplications()));
    }

    @PostMapping("/apply/{studentId}/{jobId}")
    public ResponseEntity<ApiResponse<ApplicationResponseDTO>> applyToJob(
            @PathVariable Integer studentId,
            @PathVariable Integer jobId) {
        ApplicationResponseDTO application = applicationService.applyToJob(studentId, jobId);
        return ResponseEntity.status(201).body(
                ApiResponse.success("Application submitted successfully", application));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<ApplicationResponseDTO>>> getApplicationsByStudent(
            @PathVariable Integer studentId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Applications fetched successfully",
                applicationService.getApplicationsByStudent(studentId)));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<ApiResponse<List<ApplicationResponseDTO>>> getApplicationsByJob(
            @PathVariable Integer jobId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Applications fetched successfully",
                applicationService.getApplicationsByJob(jobId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApplicationResponseDTO>> getApplicationById(
            @PathVariable Integer id) {
        return applicationService.getApplicationById(id)
                .map(dto -> ResponseEntity.ok(
                        ApiResponse.success("Application fetched successfully", dto)))
                .orElse(ResponseEntity.status(404).body(
                        ApiResponse.error("Application not found with id: " + id)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<ApplicationResponseDTO>>> getApplicationsByStatus(
            @PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(
                "Applications fetched by status successfully",
                applicationService.getApplicationsByStatus(status)));
    }

    @PutMapping("/{applicationId}/status")
    public ResponseEntity<ApiResponse<ApplicationResponseDTO>> updateApplicationStatus(
            @PathVariable Integer applicationId,
            @RequestParam String status) {
        ApplicationResponseDTO updated =
                applicationService.updateApplicationStatus(applicationId, status);
        return ResponseEntity.ok(ApiResponse.success(
                "Application status updated successfully", updated));
    }
}