package com.lasis.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class StudentRequestDTO {

    @NotBlank(message = "Full name is required")
    @Size(max = 150)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 150)
    private String email;

    @Size(max = 15)
    private String phone;

    @NotNull(message = "Department ID is required")
    private Integer departmentId;

    @NotNull(message = "GPA is required")
    @DecimalMin(value = "0.0") @DecimalMax(value = "10.0")
    private BigDecimal gpa;

    @NotNull(message = "Graduation year is required")
    private Integer graduationYear;

    @Min(0)
    private Integer backlogs = 0;

    private String resumeUrl;

    @DecimalMin(value = "0.0") @DecimalMax(value = "100.0")
    private BigDecimal projectScore = BigDecimal.ZERO;

    private Boolean isPlaced = false;
    private Boolean isActive = true;
}