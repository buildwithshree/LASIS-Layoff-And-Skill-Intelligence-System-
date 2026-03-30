package com.lasis.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SkillRequestDTO {

    @NotBlank(message = "Skill name is required")
    private String skillName;

    @NotBlank(message = "Category is required")
    private String category;

    private String demandLevel;
}
