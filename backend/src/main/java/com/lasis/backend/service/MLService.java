package com.lasis.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class MLService {

    @Autowired
    private RestTemplate restTemplate;

    private static final String ML_BASE_URL = "http://localhost:5000";

    // ── Helper: build JSON headers ────────────────────────────
    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    // ── 1. Predict company risk ───────────────────────────────
    public Map<String, Object> predictRisk(
            double totalLaidOff,
            double fundsRaised,
            String industry,
            String stage,
            String country) {

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("total_laid_off", totalLaidOff);
        requestBody.put("funds_raised", fundsRaised);
        requestBody.put("industry", industry);
        requestBody.put("stage", stage);
        requestBody.put("country", country);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, jsonHeaders());

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    ML_BASE_URL + "/ml/predict-risk",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "ML service unavailable: " + e.getMessage());
            return error;
        }
    }

    // ── 2. Match skills ───────────────────────────────────────
    public Map<String, Object> matchSkills(
            List<String> studentSkills,
            List<String> requiredSkills) {

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("student_skills", studentSkills);
        requestBody.put("required_skills", requiredSkills);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, jsonHeaders());

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    ML_BASE_URL + "/ml/skill-match",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "ML service unavailable: " + e.getMessage());
            return error;
        }
    }

    // ── 3. Health check ───────────────────────────────────────
    public Map<String, Object> healthCheck() {
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    ML_BASE_URL + "/ml/health",
                    HttpMethod.GET,
                    null,
                    Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "ML service unavailable: " + e.getMessage());
            return error;
        }
    }
}