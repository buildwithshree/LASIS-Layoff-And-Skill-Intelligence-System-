package com.lasis.backend.service;

import com.lasis.backend.dto.RiskProfileResponseDTO;
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
import java.util.stream.Collectors;

@Service
public class RiskService {

    @Autowired
    private CompanyRiskProfileRepository riskProfileRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private RiskSignalRepository riskSignalRepository;

    private RiskProfileResponseDTO toDTO(CompanyRiskProfile p) {
        return new RiskProfileResponseDTO(
            p.getRiskProfileId(),
            p.getCompany() != null ? p.getCompany().getCompanyId() : null,
            p.getCompany() != null ? p.getCompany().getCompanyName() : null,
            p.getCompany() != null ? p.getCompany().getSector() : null,
            p.getLayoffFrequency(),
            p.getLastLayoffDate(),
            p.getLayoffCount2024(),
            p.getLayoffCount2025(),
            p.getHiringTrend(),
            p.getRevenueGrowth(),
            p.getAutomationImpact(),
            p.getStabilityScore(),
            p.getRiskIndex(),
            p.getRiskLevel(),
            p.getLastCalculatedAt()
        );
    }

    public List<RiskProfileResponseDTO> getAllRiskProfiles() {
        return riskProfileRepository.findAllOrderByRiskIndexAsc()
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<RiskProfileResponseDTO> getRiskProfileByCompany(Integer companyId) {
        return riskProfileRepository.findByCompanyCompanyId(companyId).map(this::toDTO);
    }

    public List<RiskProfileResponseDTO> getSafeCompanies() {
        return riskProfileRepository.findSafeCompanies()
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<RiskProfileResponseDTO> getHighRiskCompanies() {
        return riskProfileRepository.findHighRiskCompanies()
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public RiskSignal addRiskSignal(Integer companyId, RiskSignal signal) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));
        signal.setCompany(company);
        RiskSignal saved = riskSignalRepository.save(signal);
        recalculateRisk(companyId);
        return saved;
    }

    public Map<String, Object> recalculateRisk(Integer companyId) {
        CompanyRiskProfile profile = riskProfileRepository
            .findByCompanyCompanyId(companyId)
            .orElseThrow(() -> new RuntimeException("Risk profile not found for company: " + companyId));

        BigDecimal hiringScore = switch (profile.getHiringTrend()) {
            case "growing"   -> BigDecimal.ZERO;
            case "stable"    -> new BigDecimal("25");
            case "declining" -> new BigDecimal("75");
            case "frozen"    -> new BigDecimal("100");
            default          -> new BigDecimal("25");
        };

        BigDecimal automationScore = switch (profile.getAutomationImpact()) {
            case "low"      -> BigDecimal.ZERO;
            case "medium"   -> new BigDecimal("33");
            case "high"     -> new BigDecimal("66");
            case "critical" -> new BigDecimal("100");
            default         -> new BigDecimal("33");
        };

        BigDecimal riskIndex = profile.getLayoffFrequency()
            .multiply(new BigDecimal("10"))
            .multiply(new BigDecimal("0.4"))
            .add(hiringScore.multiply(new BigDecimal("0.3")))
            .add(automationScore.multiply(new BigDecimal("0.3")))
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal stabilityScore = new BigDecimal("100")
            .subtract(riskIndex)
            .setScale(2, RoundingMode.HALF_UP);

        String riskLevel;
        if (riskIndex.compareTo(new BigDecimal("70")) >= 0)      riskLevel = "critical";
        else if (riskIndex.compareTo(new BigDecimal("50")) >= 0) riskLevel = "high";
        else if (riskIndex.compareTo(new BigDecimal("25")) >= 0) riskLevel = "medium";
        else                                                      riskLevel = "low";

        String recommendation;
        if (riskIndex.compareTo(new BigDecimal("70")) >= 0)
            recommendation = "Very high risk. Strongly advise against applying.";
        else if (riskIndex.compareTo(new BigDecimal("50")) >= 0)
            recommendation = "High risk. Apply with caution.";
        else if (riskIndex.compareTo(new BigDecimal("25")) >= 0)
            recommendation = "Moderate risk. Research before applying.";
        else
            recommendation = "Low risk. Safe to apply.";

        profile.setRiskIndex(riskIndex);
        profile.setStabilityScore(stabilityScore);
        profile.setRiskLevel(riskLevel);
        riskProfileRepository.save(profile);

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
        List<RiskProfileResponseDTO> all = getAllRiskProfiles();
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalCompanies", all.size());
        dashboard.put("safeCompanies", all.stream().filter(p -> p.getRiskLevel().equals("low")).count());
        dashboard.put("mediumRiskCompanies", all.stream().filter(p -> p.getRiskLevel().equals("medium")).count());
        dashboard.put("highRiskCompanies", all.stream().filter(p -> p.getRiskLevel().equals("high")).count());
        dashboard.put("criticalRiskCompanies", all.stream().filter(p -> p.getRiskLevel().equals("critical")).count());
        dashboard.put("profiles", all);
        return dashboard;
    }

    // Used internally by ReadinessService
    public Optional<CompanyRiskProfile> getRiskProfileEntityByCompany(Integer companyId) {
        return riskProfileRepository.findByCompanyCompanyId(companyId);
    }
}