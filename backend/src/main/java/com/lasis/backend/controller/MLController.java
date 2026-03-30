package com.lasis.backend.controller;

import com.lasis.backend.dto.ApiResponse;
import com.lasis.backend.service.MLService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ml")
public class MLController {

    @Autowired
    private MLService mlService;

    // ── Health check ──────────────────────────────────────────
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> result = mlService.healthCheck();
        return ResponseEntity.ok(ApiResponse.success("ML service health checked", result));
    }

    // ── Predict company risk ──────────────────────────────────
    @PostMapping("/predict-risk")
    public ResponseEntity<ApiResponse<Map<String, Object>>> predictRisk(
            @RequestBody Map<String, Object> request) {

        double totalLaidOff = Double.parseDouble(request.get("total_laid_off").toString());
        double fundsRaised = Double.parseDouble(request.get("funds_raised").toString());
        String industry = request.get("industry").toString();
        String stage = request.get("stage").toString();
        String country = request.get("country").toString();

        Map<String, Object> result = mlService.predictRisk(
                totalLaidOff, fundsRaised, industry, stage, country);

        return ResponseEntity.ok(ApiResponse.success("Risk prediction completed", result));
    }

    // ── Skill match ───────────────────────────────────────────
    @PostMapping("/skill-match")
    public ResponseEntity<ApiResponse<Map<String, Object>>> skillMatch(
            @RequestBody Map<String, Object> request) {

        List<String> studentSkills = (List<String>) request.get("student_skills");
        List<String> requiredSkills = (List<String>) request.get("required_skills");

        Map<String, Object> result = mlService.matchSkills(studentSkills, requiredSkills);

        return ResponseEntity.ok(ApiResponse.success("Skill match completed", result));
    }
}
