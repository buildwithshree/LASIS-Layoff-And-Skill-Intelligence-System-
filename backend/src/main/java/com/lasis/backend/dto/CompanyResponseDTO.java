package com.lasis.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyResponseDTO {

    private Integer companyId;
    private String companyName;
    private String sector;
    private String companyType;
    private String fundingStage;
    private String headquarters;
    private String website;
    private Boolean isActiveRecruiter;
    private String recruiterEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}