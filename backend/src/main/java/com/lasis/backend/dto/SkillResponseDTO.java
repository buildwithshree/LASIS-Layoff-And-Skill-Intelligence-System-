package com.lasis.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillResponseDTO {

    private Integer skillId;
    private String skillName;
    private String category;
    private String demandLevel;
    private LocalDateTime createdAt;
}