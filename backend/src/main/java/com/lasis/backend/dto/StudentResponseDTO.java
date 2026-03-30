package com.lasis.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponseDTO {

    private Integer studentId;
    private String fullName;
    private String email;
    private String phone;
    private Integer departmentId;
    private String departmentName;
    private BigDecimal gpa;
    private Integer graduationYear;
    private Integer backlogs;
    private String resumeUrl;
    private BigDecimal projectScore;
    private Boolean isPlaced;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
