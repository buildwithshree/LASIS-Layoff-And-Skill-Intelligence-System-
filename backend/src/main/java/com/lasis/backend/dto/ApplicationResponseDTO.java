package com.lasis.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponseDTO {

    private Integer applicationId;

    // Student (flattened)
    private Integer studentId;
    private String studentName;

    // Job (flattened)
    private Integer jobId;
    private String jobTitle;
    private String companyName;

    private String status;
    private String notes;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
}