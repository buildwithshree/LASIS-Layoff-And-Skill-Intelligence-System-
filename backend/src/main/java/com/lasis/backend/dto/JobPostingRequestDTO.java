package com.lasis.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class JobPostingRequestDTO {

    @NotNull(message = "Company ID is required")
    private Integer companyId;

    @NotBlank(message = "Job title is required")
    @Size(max = 150)
    private String jobTitle;

    private String jobDescription;

    @NotBlank(message = "Required skills are required")
    private String requiredSkills;

    private BigDecimal salaryMin;
    private BigDecimal salaryMax;

    @DecimalMin(value = "0.0") @DecimalMax(value = "10.0")
    private BigDecimal requiredGpa = new BigDecimal("6.0");

    @Min(0)
    private Integer maxBacklogs = 0;

    @Size(max = 50)
    private String jobType = "Full-Time";

    @Size(max = 50)
    private String experienceRequired = "Fresher";

    @Min(1)
    private Integer openings = 1;

    private LocalDate applicationDeadline;
    private Boolean isActive = true;
}
