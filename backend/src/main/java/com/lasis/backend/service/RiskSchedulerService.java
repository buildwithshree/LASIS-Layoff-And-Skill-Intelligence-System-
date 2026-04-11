package com.lasis.backend.service;

import com.lasis.backend.dto.CompanyResponseDTO;
import com.lasis.backend.model.RiskSignal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class RiskSchedulerService {

    @Autowired
    private CompanyService companyService;

    @Autowired
    private RiskService riskService;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${gnews.api.key}")
    private String gnewsApiKey;

    private static final String ML_BASE_URL = "http://localhost:5000";

    // ── Runs every day at 6:00 AM ─────────────────────────────
    @Scheduled(cron = "0 0 6 * * *")
    public void autoScanAllCompanies() {
        log.info("=== LASIS Auto-Scan Started ===");

        List<CompanyResponseDTO> companies = companyService.getAllCompanies();
        if (companies.isEmpty()) {
            log.warn("Auto-scan: no companies found in database. Skipping.");
            return;
        }

        List<String> companyNames = companies.stream()
                .map(CompanyResponseDTO::getCompanyName)
                .toList();

        log.info("Auto-scan: scanning {} companies → {}", companyNames.size(), companyNames);

        // ── Call Python /ml/auto-scan ─────────────────────────
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("company_names", companyNames);
        requestBody.put("api_key", gnewsApiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        Map<?, ?> response;
        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    ML_BASE_URL + "/ml/auto-scan",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );
            response = responseEntity.getBody();
        } catch (Exception e) {
            log.error("Auto-scan: failed to reach ML service — {}", e.getMessage());
            return;
        }

        if (response == null || !Boolean.TRUE.equals(response.get("success"))) {
            log.error("Auto-scan: ML service returned failure — {}", response);
            return;
        }

        List<?> results = (List<?>) response.get("results");
        if (results == null || results.isEmpty()) {
            log.warn("Auto-scan: ML returned no results.");
            return;
        }

        int totalSignalsSaved = 0;
        int companiesUpdated = 0;

        // ── Process each company result ───────────────────────
        for (Object resultObj : results) {
            if (!(resultObj instanceof Map<?, ?> result)) continue;

            String companyName = (String) result.get("company_name");
            String error = (String) result.get("error");

            if (error != null) {
                log.warn("Auto-scan: skipping '{}' — {}", companyName, error);
                continue;
            }

            List<?> signals = (List<?>) result.get("signals");
            if (signals == null || signals.isEmpty()) {
                log.info("Auto-scan: no signals found for '{}'", companyName);
                continue;
            }

            // ── Find matching company in DB ───────────────────
            CompanyResponseDTO matchedCompany = companies.stream()
                    .filter(c -> c.getCompanyName().equalsIgnoreCase(companyName))
                    .findFirst()
                    .orElse(null);

            if (matchedCompany == null) {
                log.warn("Auto-scan: no DB match for company name '{}'", companyName);
                continue;
            }

            Integer companyId = matchedCompany.getCompanyId();
            int signalsSavedForCompany = 0;

            // ── Save each signal ──────────────────────────────
            for (Object signalObj : signals) {
                if (!(signalObj instanceof Map<?, ?> signalMap)) continue;

                try {
                    RiskSignal signal = new RiskSignal();

                    String headline = (String) signalMap.get("headline");
                    if (headline == null || headline.isBlank()) continue;
                    signal.setHeadline(headline);

                    String signalType = (String) signalMap.get("signal_type");
                    signal.setSignalType(signalType != null ? signalType : "NEWS");

                    String signalSource = (String) signalMap.get("signal_source");
                    signal.setSignalSource(signalSource != null ? signalSource : "GNews");

                    Object severityObj = signalMap.get("severity_score");
                    if (severityObj instanceof Number num) {
                        signal.setSeverityScore(BigDecimal.valueOf(num.doubleValue()));
                    } else {
                        signal.setSeverityScore(BigDecimal.valueOf(0.2));
                    }

                    Object affectedObj = signalMap.get("affected_count");
                    if (affectedObj instanceof Number num) {
                        signal.setAffectedCount(num.intValue());
                    } else {
                        signal.setAffectedCount(0);
                    }

                    String signalDateStr = (String) signalMap.get("signal_date");
                    if (signalDateStr != null && !signalDateStr.isBlank()) {
                        try {
                            signal.setSignalDate(LocalDate.parse(signalDateStr));
                        } catch (DateTimeParseException e) {
                            signal.setSignalDate(LocalDate.now());
                        }
                    } else {
                        signal.setSignalDate(LocalDate.now());
                    }

                    signal.setIsVerified(false);

                    riskService.addRiskSignal(companyId, signal);
                    signalsSavedForCompany++;
                    totalSignalsSaved++;

                } catch (Exception e) {
                    log.error("Auto-scan: error saving signal for '{}' — {}", companyName, e.getMessage());
                }
            }

            if (signalsSavedForCompany > 0) {
                log.info("Auto-scan: saved {} signals for '{}', risk recalculated.", signalsSavedForCompany, companyName);
                companiesUpdated++;
            }
        }

        log.info("=== LASIS Auto-Scan Complete — {} signals saved across {} companies ===",
                totalSignalsSaved, companiesUpdated);
    }
}
