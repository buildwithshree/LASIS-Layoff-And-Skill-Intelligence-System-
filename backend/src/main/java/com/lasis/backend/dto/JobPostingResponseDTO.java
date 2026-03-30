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
public class JobPostingResponseDTO {

    private Integer jobId;
    private Integer companyId;
    private String companyName;
    private String jobTitle;
    private String jobDescription;
    private String requiredSkills;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private BigDecimal requiredGpa;
    private Integer maxBacklogs;
    private String jobType;
    private String experienceRequired;
    private Integer openings;
    private LocalDate applicationDeadline;
    private Boolean isActive;
    private LocalDateTime postedAt;
    private LocalDateTime updatedAt;
}
