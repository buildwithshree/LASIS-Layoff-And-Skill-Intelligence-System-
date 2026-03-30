package com.lasis.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessResponseDTO {

    private Integer scoreId;
    private Integer studentId;
    private String studentName;
    private Integer jobId;
    private String jobTitle;
    private String companyName;
    private BigDecimal skillMatchScore;
    private BigDecimal gpaWeight;
    private BigDecimal projectScore;
    private BigDecimal companyRiskScore;
    private BigDecimal finalReadiness;
    private String readinessLevel;
    private String missingSkills;
    private String recommendation;
    private LocalDateTime calculatedAt;
}
