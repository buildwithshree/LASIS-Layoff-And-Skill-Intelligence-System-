package com.lasis.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CompanyRequestDTO {

    @NotBlank(message = "Company name is required")
    @Size(max = 150, message = "Company name must be under 150 characters")
    private String companyName;

    @NotBlank(message = "Sector is required")
    @Size(max = 100)
    private String sector;

    @NotBlank(message = "Company type is required")
    @Size(max = 50)
    private String companyType;

    @Size(max = 50)
    private String fundingStage;

    @Size(max = 100)
    private String headquarters;

    @Size(max = 200)
    private String website;

    private Boolean isActiveRecruiter = true;
}