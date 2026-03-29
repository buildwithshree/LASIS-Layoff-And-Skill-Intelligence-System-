package com.lasis.backend.service;

import com.lasis.backend.model.Company;
import com.lasis.backend.model.CompanyRiskProfile;
import com.lasis.backend.model.RiskSignal;
import com.lasis.backend.repository.CompanyRepository;
import com.lasis.backend.repository.CompanyRiskProfileRepository;
import com.lasis.backend.repository.RiskSignalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RiskService {

    @Autowired
    private CompanyRiskProfileRepository riskProfileRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private RiskSignalRepository riskSignalRepository;

    public List<CompanyRiskProfile> getAllRiskProfiles() {
        return riskProfileRepository.findAllOrderByRiskIndexAsc();
    }

    public Optional<CompanyRiskProfile> getRiskProfileByCompany(Integer companyId) {
        return riskProfileRepository.findByCompanyCompanyId(companyId);
    }

    public List<CompanyRiskProfile> getSafeCompanies() {
        return riskProfileRepository.findSafeCompanies();
    }

    public List<CompanyRiskProfile> getHighRiskCompanies() {
        return riskProfileRepository.findHighRiskCompanies();
    }

    public RiskSignal addRiskSignal(Integer companyId, RiskSignal signal) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));
        signal.setCompany(company);
        RiskSignal saved = riskSignalRepository.save(signal);
        // recalculate risk after new signal
        recalculateRisk(companyId);
        return saved;
    }

    public Map<String, Object> recalculateRisk(Integer companyId) {
        CompanyRiskProfile profile = riskProfileRepository
            .findByCompanyCompanyId(companyId)
            .orElseThrow(() -> new RuntimeException("Risk profile not found for company: " + companyId));

        // hiring score
        BigDecimal hiringScore;
        switch (profile.getHiringTrend()) {
            case "growing"   -> hiringScore = BigDecimal.ZERO;
            case "stable"    -> hiringScore = new BigDecimal("25");
            case "declining" -> hiringScore = new BigDecimal("75");
            case "frozen"    -> hiringScore = new BigDecimal("100");
            default          -> hiringScore = new BigDecimal("25");
        }

        // automation score
        BigDecimal automationScore;
        switch (profile.getAutomationImpact()) {
            case "low"      -> automationScore = BigDecimal.ZERO;
            case "medium"   -> automationScore = new BigDecimal("33");
            case "high"     -> automationScore = new BigDecimal("66");
            case "critical" -> automationScore = new BigDecimal("100");
            default         -> automationScore = new BigDecimal("33");
        }

        // risk index formula
        // riskIndex = (0.4 × layoffFrequency × 10) + (0.3 × hiringScore) + (0.3 × automationScore)
        BigDecimal riskIndex = profile.getLayoffFrequency()
            .multiply(new BigDecimal("10"))
            .multiply(new BigDecimal("0.4"))
            .add(hiringScore.multiply(new BigDecimal("0.3")))
            .add(automationScore.multiply(new BigDecimal("0.3")))
            .setScale(2, RoundingMode.HALF_UP);

        // stability score
        BigDecimal stabilityScore = new BigDecimal("100")
            .subtract(riskIndex)
            .setScale(2, RoundingMode.HALF_UP);

        // risk level
        String riskLevel;
        if (riskIndex.compareTo(new BigDecimal("70")) >= 0)      riskLevel = "critical";
        else if (riskIndex.compareTo(new BigDecimal("50")) >= 0) riskLevel = "high";
        else if (riskIndex.compareTo(new BigDecimal("25")) >= 0) riskLevel = "medium";
        else                                                      riskLevel = "low";

        // recommendation
        String recommendation;
        if (riskIndex.compareTo(new BigDecimal("70")) >= 0)
            recommendation = "Very high risk. Strongly advise against applying.";
        else if (riskIndex.compareTo(new BigDecimal("50")) >= 0)
            recommendation = "High risk. Apply with caution.";
        else if (riskIndex.compareTo(new BigDecimal("25")) >= 0)
            recommendation = "Moderate risk. Research before applying.";
        else
            recommendation = "Low risk. Safe to apply.";

        // update profile
        profile.setRiskIndex(riskIndex);
        profile.setStabilityScore(stabilityScore);
        profile.setRiskLevel(riskLevel);
        riskProfileRepository.save(profile);

        // build response
        Map<String, Object> result = new HashMap<>();
        result.put("companyId", companyId);
        result.put("companyName", profile.getCompany().getCompanyName());
        result.put("riskIndex", riskIndex);
        result.put("riskLevel", riskLevel);
        result.put("stabilityScore", stabilityScore);
        result.put("recommendation", recommendation);
        result.put("hiringTrend", profile.getHiringTrend());
        result.put("automationImpact", profile.getAutomationImpact());
        result.put("layoffFrequency", profile.getLayoffFrequency());
        return result;
    }

    public Map<String, Object> getRiskDashboard() {
        List<CompanyRiskProfile> all = riskProfileRepository.findAllOrderByRiskIndexAsc();
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalCompanies", all.size());
        dashboard.put("safeCompanies", all.stream().filter(p -> p.getRiskLevel().equals("low")).count());
        dashboard.put("mediumRiskCompanies", all.stream().filter(p -> p.getRiskLevel().equals("medium")).count());
        dashboard.put("highRiskCompanies", all.stream().filter(p -> p.getRiskLevel().equals("high")).count());
        dashboard.put("criticalRiskCompanies", all.stream().filter(p -> p.getRiskLevel().equals("critical")).count());
        dashboard.put("profiles", all);
        return dashboard;
    }
}
