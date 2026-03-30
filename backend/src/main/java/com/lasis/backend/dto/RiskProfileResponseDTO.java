package com.lasis.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskProfileResponseDTO {

    private Integer riskProfileId;
    private Integer companyId;
    private String companyName;
    private String sector;
    private BigDecimal layoffFrequency;
    private LocalDate lastLayoffDate;
    private Integer layoffCount2024;
    private Integer layoffCount2025;
    private String hiringTrend;
    private BigDecimal revenueGrowth;
    private String automationImpact;
    private BigDecimal stabilityScore;
    private BigDecimal riskIndex;
    private String riskLevel;
    private LocalDateTime lastCalculatedAt;
}
