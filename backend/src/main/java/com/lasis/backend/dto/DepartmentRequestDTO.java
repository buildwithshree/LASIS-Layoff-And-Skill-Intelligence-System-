package com.lasis.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DepartmentRequestDTO {

    @NotBlank(message = "Department name is required")
    private String deptName;

    @NotBlank(message = "Department code is required")
    private String deptCode;
}