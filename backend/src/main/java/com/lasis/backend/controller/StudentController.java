package com.lasis.backend.controller;

import com.lasis.backend.model.Student;
import com.lasis.backend.model.StudentSkill;
import com.lasis.backend.service.SkillService;
import com.lasis.backend.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private SkillService skillService;

    @GetMapping
    public List<Student> getAllStudents() {
        return studentService.getAllStudents();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Integer id) {
        return studentService.getStudentById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/unplaced")
    public List<Student> getUnplacedStudents() {
        return studentService.getUnplacedStudents();
    }

    @GetMapping("/eligible")
    public List<Student> getEligibleStudents(
            @RequestParam(defaultValue = "7.0") BigDecimal minGpa,
            @RequestParam(defaultValue = "0") Integer maxBacklogs) {
        return studentService.getEligibleStudents(minGpa, maxBacklogs);
    }

    @GetMapping("/department/{departmentId}")
    public List<Student> getStudentsByDepartment(@PathVariable Integer departmentId) {
        return studentService.getStudentsByDepartment(departmentId);
    }

    @PostMapping
    public Student createStudent(@RequestBody Student student) {
        return studentService.createStudent(student);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable Integer id,
                                                  @RequestBody Student student) {
        try {
            return ResponseEntity.ok(studentService.updateStudent(id, student));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{studentId}/skills/{skillId}")
    public ResponseEntity<StudentSkill> addSkillToStudent(
            @PathVariable Integer studentId,
            @PathVariable Integer skillId,
            @RequestParam String proficiencyLevel) {
        try {
            return ResponseEntity.ok(skillService.addSkillToStudent(studentId, skillId, proficiencyLevel));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{studentId}/skills")
    public List<StudentSkill> getStudentSkills(@PathVariable Integer studentId) {
        return skillService.getStudentSkills(studentId);
    }

    @PutMapping("/{id}/place")
    public ResponseEntity<Student> markAsPlaced(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(studentService.markAsPlaced(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
