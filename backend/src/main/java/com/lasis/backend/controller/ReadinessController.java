package com.lasis.backend.controller;

import com.lasis.backend.model.ReadinessScore;
import com.lasis.backend.service.ReadinessService;
import com.lasis.backend.service.RiskService;
import com.lasis.backend.model.RiskSignal;
import com.lasis.backend.model.CompanyRiskProfile;
import org.springframework.beans.factory.annotation.Autowired;
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
    public ResponseEntity<?> calculateReadiness(@PathVariable Integer studentId,
                                                 @PathVariable Integer jobId) {
        try {
            return ResponseEntity.ok(readinessService.calculateReadiness(studentId, jobId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/api/readiness/all-jobs/{studentId}")
    public ResponseEntity<?> calculateReadinessForAllJobs(@PathVariable Integer studentId) {
        try {
            return ResponseEntity.ok(readinessService.calculateReadinessForAllJobs(studentId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/api/readiness/student/{studentId}")
    public List<ReadinessScore> getStudentReadinessHistory(@PathVariable Integer studentId) {
        return readinessService.getStudentReadinessHistory(studentId);
    }

    // =============================================
    // RISK ENDPOINTS
    // =============================================

    @GetMapping("/api/risk/all")
    public List<CompanyRiskProfile> getAllRiskProfiles() {
        return riskService.getAllRiskProfiles();
    }

    @GetMapping("/api/risk/company/{companyId}")
    public ResponseEntity<?> getRiskByCompany(@PathVariable Integer companyId) {
        return riskService.getRiskProfileByCompany(companyId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/risk/safe")
    public List<CompanyRiskProfile> getSafeCompanies() {
        return riskService.getSafeCompanies();
    }

    @GetMapping("/api/risk/high")
    public List<CompanyRiskProfile> getHighRiskCompanies() {
        return riskService.getHighRiskCompanies();
    }

    @GetMapping("/api/risk/dashboard")
    public Map<String, Object> getRiskDashboard() {
        return riskService.getRiskDashboard();
    }

    @PostMapping("/api/risk/signal/{companyId}")
    public ResponseEntity<?> addRiskSignal(@PathVariable Integer companyId,
                                            @RequestBody RiskSignal signal) {
        try {
            return ResponseEntity.ok(riskService.addRiskSignal(companyId, signal));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/api/risk/recalculate/{companyId}")
    public ResponseEntity<?> recalculateRisk(@PathVariable Integer companyId) {
        try {
            return ResponseEntity.ok(riskService.recalculateRisk(companyId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}


