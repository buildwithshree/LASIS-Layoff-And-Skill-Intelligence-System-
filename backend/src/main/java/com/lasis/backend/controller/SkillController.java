package com.lasis.backend.controller;

import com.lasis.backend.model.Skill;
import com.lasis.backend.service.SkillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/skills")
@CrossOrigin(origins = "*")
public class SkillController {

    @Autowired
    private SkillService skillService;

    @GetMapping
    public List<Skill> getAllSkills() {
        return skillService.getAllSkills();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Skill> getSkillById(@PathVariable Integer id) {
        return skillService.getSkillById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    public List<Skill> getSkillsByCategory(@PathVariable String category) {
        return skillService.getSkillsByCategory(category);
    }

    @GetMapping("/critical")
    public List<Skill> getCriticalSkills() {
        return skillService.getCriticalSkills();
    }

    @PostMapping
    public Skill createSkill(@RequestBody Skill skill) {
        return skillService.createSkill(skill);
    }
}