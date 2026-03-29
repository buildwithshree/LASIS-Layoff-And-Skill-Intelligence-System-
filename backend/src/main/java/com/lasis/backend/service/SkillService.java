package com.lasis.backend.service;

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

@Service
public class SkillService {

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private StudentSkillRepository studentSkillRepository;

    @Autowired
    private StudentRepository studentRepository;

    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }

    public Optional<Skill> getSkillById(Integer id) {
        return skillRepository.findById(id);
    }

    public List<Skill> getSkillsByCategory(String category) {
        return skillRepository.findByCategory(category);
    }

    public List<Skill> getCriticalSkills() {
        return skillRepository.findByDemandLevel("critical");
    }

    public Skill createSkill(Skill skill) {
        return skillRepository.save(skill);
    }

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
}
