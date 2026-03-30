package com.lasis.backend.controller;

import com.lasis.backend.dto.ApiResponse;
import com.lasis.backend.dto.SkillRequestDTO;
import com.lasis.backend.dto.SkillResponseDTO;
import com.lasis.backend.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    @Autowired
    private SkillService skillService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SkillResponseDTO>>> getAllSkills() {
        List<SkillResponseDTO> skills = skillService.getAllSkills();
        return ResponseEntity.ok(ApiResponse.success("Skills fetched successfully", skills));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SkillResponseDTO>> getSkillById(@PathVariable Integer id) {
        return skillService.getSkillById(id)
                .map(dto -> ResponseEntity.ok(ApiResponse.success("Skill fetched successfully", dto)))
                .orElse(ResponseEntity.status(404).body(ApiResponse.error("Skill not found with id: " + id)));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<SkillResponseDTO>>> getSkillsByCategory(@PathVariable String category) {
        List<SkillResponseDTO> skills = skillService.getSkillsByCategory(category);
        return ResponseEntity.ok(ApiResponse.success("Skills fetched by category successfully", skills));
    }

    @GetMapping("/critical")
    public ResponseEntity<ApiResponse<List<SkillResponseDTO>>> getCriticalSkills() {
        List<SkillResponseDTO> skills = skillService.getCriticalSkills();
        return ResponseEntity.ok(ApiResponse.success("Critical skills fetched successfully", skills));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SkillResponseDTO>> createSkill(
            @Valid @RequestBody SkillRequestDTO requestDTO) {
        SkillResponseDTO created = skillService.createSkill(requestDTO);
        return ResponseEntity.status(201).body(ApiResponse.success("Skill created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SkillResponseDTO>> updateSkill(
            @PathVariable Integer id,
            @Valid @RequestBody SkillRequestDTO requestDTO) {
        SkillResponseDTO updated = skillService.updateSkill(id, requestDTO);
        return ResponseEntity.ok(ApiResponse.success("Skill updated successfully", updated));
    }
}