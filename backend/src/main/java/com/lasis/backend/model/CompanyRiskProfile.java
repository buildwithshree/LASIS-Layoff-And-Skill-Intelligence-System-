package com.lasis.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "company_risk_profiles")
public class CompanyRiskProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "risk_profile_id")
    private Integer riskProfileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false, unique = true)
    private Company company;

    @Column(name = "layoff_frequency", precision = 5, scale = 2)
    private BigDecimal layoffFrequency = BigDecimal.ZERO;

    @Column(name = "last_layoff_date")
    private LocalDate lastLayoffDate;

    @Column(name = "layoff_count_2024")
    private Integer layoffCount2024 = 0;

    @Column(name = "layoff_count_2025")
    private Integer layoffCount2025 = 0;

    @Column(name = "hiring_trend", length = 20)
    private String hiringTrend = "stable";

    @Column(name = "revenue_growth", precision = 6, scale = 2)
    private BigDecimal revenueGrowth = BigDecimal.ZERO;

    @Column(name = "automation_impact", length = 20)
    private String automationImpact = "medium";

    @Column(name = "stability_score", precision = 5, scale = 2)
    private BigDecimal stabilityScore = new BigDecimal("50");

    @Column(name = "risk_index", precision = 5, scale = 2)
    private BigDecimal riskIndex = new BigDecimal("50");

    @Column(name = "risk_level", length = 20)
    private String riskLevel = "medium";

    @Column(name = "last_calculated_at")
    private LocalDateTime lastCalculatedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastCalculatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastCalculatedAt = LocalDateTime.now();
    }
}
