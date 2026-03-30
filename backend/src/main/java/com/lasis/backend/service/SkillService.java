package com.lasis.backend.service;

import com.lasis.backend.dto.SkillRequestDTO;
import com.lasis.backend.dto.SkillResponseDTO;
import com.lasis.backend.model.Skill;
import com.lasis.backend.model.Student;
import com.lasis.backend.model.StudentSkill;
import com.lasis.backend.repository.SkillRepository;
import com.lasis.backend.repository.StudentRepository;
import com.lasis.backend.repository.StudentSkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SkillService {

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private StudentSkillRepository studentSkillRepository;

    @Autowired
    private StudentRepository studentRepository;

    // ─── Mapper: Entity → DTO ───────────────────────────────────────────
    private SkillResponseDTO toDTO(Skill skill) {
        SkillResponseDTO dto = new SkillResponseDTO();
        dto.setSkillId(skill.getSkillId());
        dto.setSkillName(skill.getSkillName());
        dto.setCategory(skill.getCategory());
        dto.setDemandLevel(skill.getDemandLevel());
        dto.setCreatedAt(skill.getCreatedAt());
        return dto;
    }

    // ─── Mapper: DTO → Entity ───────────────────────────────────────────
    private Skill toEntity(SkillRequestDTO dto) {
        Skill skill = new Skill();
        skill.setSkillName(dto.getSkillName());
        skill.setCategory(dto.getCategory());
        skill.setDemandLevel(dto.getDemandLevel() != null ? dto.getDemandLevel() : "medium");
        return skill;
    }

    // ─── DTO-based Public Methods ────────────────────────────────────────
    public List<SkillResponseDTO> getAllSkills() {
        return skillRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<SkillResponseDTO> getSkillById(Integer id) {
        return skillRepository.findById(id)
                .map(this::toDTO);
    }

    public List<SkillResponseDTO> getSkillsByCategory(String category) {
        return skillRepository.findByCategory(category)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<SkillResponseDTO> getCriticalSkills() {
        return skillRepository.findByDemandLevel("critical")
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public SkillResponseDTO createSkill(SkillRequestDTO requestDTO) {
        Skill skill = toEntity(requestDTO);
        Skill saved = skillRepository.save(skill);
        return toDTO(saved);
    }

    public SkillResponseDTO updateSkill(Integer id, SkillRequestDTO requestDTO) {
        Skill existing = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found with id: " + id));
        existing.setSkillName(requestDTO.getSkillName());
        existing.setCategory(requestDTO.getCategory());
        if (requestDTO.getDemandLevel() != null) {
            existing.setDemandLevel(requestDTO.getDemandLevel());
        }
        Skill updated = skillRepository.save(existing);
        return toDTO(updated);
    }

    // ─── Student-Skill methods (used by StudentController) ──────────────
    public StudentSkill addSkillToStudent(Integer studentId, Integer skillId, String proficiencyLevel) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + skillId));

        if (studentSkillRepository.existsByStudentStudentIdAndSkillSkillId(studentId, skillId)) {
            StudentSkill existing = studentSkillRepository
                    .findByStudentStudentIdAndSkillSkillId(studentId, skillId)
                    .orElseThrow();
            existing.setProficiencyLevel(proficiencyLevel);
            return studentSkillRepository.save(existing);
        }

        StudentSkill studentSkill = new StudentSkill();
        studentSkill.setStudent(student);
        studentSkill.setSkill(skill);
        studentSkill.setProficiencyLevel(proficiencyLevel);
        return studentSkillRepository.save(studentSkill);
    }

    public List<StudentSkill> getStudentSkills(Integer studentId) {
        return studentSkillRepository.findByStudentStudentId(studentId);
    }

    // ─── Internal use only ──────────────────────────────────────────────
    public Optional<Skill> getSkillEntityById(Integer id) {
        return skillRepository.findById(id);
    }
}