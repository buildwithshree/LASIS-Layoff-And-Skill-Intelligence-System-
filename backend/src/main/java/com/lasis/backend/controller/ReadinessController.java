package com.lasis.backend.controller;

import com.lasis.backend.dto.ApiResponse;
import com.lasis.backend.dto.ReadinessResponseDTO;
import com.lasis.backend.dto.RiskProfileResponseDTO;
import com.lasis.backend.model.RiskSignal;
import com.lasis.backend.service.ReadinessService;
import com.lasis.backend.service.RiskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class ReadinessController {

    @Autowired
    private ReadinessService readinessService;

    @Autowired
    private RiskService riskService;

    // =============================================
    // READINESS ENDPOINTS
    // =============================================

    @GetMapping("/api/readiness/calculate/{studentId}/{jobId}")
    public ResponseEntity<ApiResponse<?>> calculateReadiness(
            @PathVariable Integer studentId, @PathVariable Integer jobId) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Readiness calculated successfully",
                readinessService.calculateReadiness(studentId, jobId)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/api/readiness/all-jobs/{studentId}")
    public ResponseEntity<ApiResponse<?>> calculateReadinessForAllJobs(@PathVariable Integer studentId) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Readiness for all jobs calculated",
                readinessService.calculateReadinessForAllJobs(studentId)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/api/readiness/student/{studentId}")
    public ResponseEntity<ApiResponse<List<ReadinessResponseDTO>>> getStudentReadinessHistory(
            @PathVariable Integer studentId) {
        return ResponseEntity.ok(ApiResponse.success("Readiness history fetched successfully",
            readinessService.getStudentReadinessHistory(studentId)));
    }

    // =============================================
    // RISK ENDPOINTS
    // =============================================

    @GetMapping("/api/risk/all")
    public ResponseEntity<ApiResponse<List<RiskProfileResponseDTO>>> getAllRiskProfiles() {
        return ResponseEntity.ok(ApiResponse.success("Risk profiles fetched successfully",
            riskService.getAllRiskProfiles()));
    }

    @GetMapping("/api/risk/company/{companyId}")
    public ResponseEntity<ApiResponse<RiskProfileResponseDTO>> getRiskByCompany(@PathVariable Integer companyId) {
        return riskService.getRiskProfileByCompany(companyId)
            .map(p -> ResponseEntity.ok(ApiResponse.success("Risk profile fetched successfully", p)))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Risk profile not found for company: " + companyId)));
    }

    @GetMapping("/api/risk/safe")
    public ResponseEntity<ApiResponse<List<RiskProfileResponseDTO>>> getSafeCompanies() {
        return ResponseEntity.ok(ApiResponse.success("Safe companies fetched successfully",
            riskService.getSafeCompanies()));
    }

    @GetMapping("/api/risk/high")
    public ResponseEntity<ApiResponse<List<RiskProfileResponseDTO>>> getHighRiskCompanies() {
        return ResponseEntity.ok(ApiResponse.success("High risk companies fetched successfully",
            riskService.getHighRiskCompanies()));
    }

    @GetMapping("/api/risk/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRiskDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Risk dashboard fetched successfully",
            riskService.getRiskDashboard()));
    }

    @PostMapping("/api/risk/signal/{companyId}")
    public ResponseEntity<ApiResponse<RiskSignal>> addRiskSignal(
            @PathVariable Integer companyId, @RequestBody RiskSignal signal) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Risk signal added successfully",
                riskService.addRiskSignal(companyId, signal)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/api/risk/recalculate/{companyId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recalculateRisk(@PathVariable Integer companyId) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Risk recalculated successfully",
                riskService.recalculateRisk(companyId)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }
}