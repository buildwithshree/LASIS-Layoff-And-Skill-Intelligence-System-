package com.lasis.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplicationRequestDTO {

    @NotNull(message = "Student ID is required")
    private Integer studentId;

    @NotNull(message = "Job ID is required")
    private Integer jobId;

    private String notes;
}
