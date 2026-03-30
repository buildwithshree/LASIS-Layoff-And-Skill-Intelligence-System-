package com.lasis.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentResponseDTO {

    private Integer departmentId;
    private String deptName;
    private String deptCode;
    private LocalDateTime createdAt;
}