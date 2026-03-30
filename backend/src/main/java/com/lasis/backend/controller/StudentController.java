package com.lasis.backend.controller;

import com.lasis.backend.dto.ApiResponse;
import com.lasis.backend.dto.StudentRequestDTO;
import com.lasis.backend.dto.StudentResponseDTO;
import com.lasis.backend.model.StudentSkill;
import com.lasis.backend.service.SkillService;
import com.lasis.backend.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<ApiResponse<List<StudentResponseDTO>>> getAllStudents() {
        return ResponseEntity.ok(ApiResponse.success("Students fetched successfully", studentService.getAllStudents()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> getStudentById(@PathVariable Integer id) {
        return studentService.getStudentById(id)
            .map(s -> ResponseEntity.ok(ApiResponse.success("Student fetched successfully", s)))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Student not found with id: " + id)));
    }

    @GetMapping("/unplaced")
    public ResponseEntity<ApiResponse<List<StudentResponseDTO>>> getUnplacedStudents() {
        return ResponseEntity.ok(ApiResponse.success("Unplaced students fetched successfully", studentService.getUnplacedStudents()));
    }

    @GetMapping("/eligible")
    public ResponseEntity<ApiResponse<List<StudentResponseDTO>>> getEligibleStudents(
            @RequestParam(defaultValue = "7.0") BigDecimal minGpa,
            @RequestParam(defaultValue = "0") Integer maxBacklogs) {
        return ResponseEntity.ok(ApiResponse.success("Eligible students fetched successfully",
            studentService.getEligibleStudents(minGpa, maxBacklogs)));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ApiResponse<List<StudentResponseDTO>>> getStudentsByDepartment(@PathVariable Integer departmentId) {
        return ResponseEntity.ok(ApiResponse.success("Students fetched successfully",
            studentService.getStudentsByDepartment(departmentId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StudentResponseDTO>> createStudent(@Valid @RequestBody StudentRequestDTO dto) {
        StudentResponseDTO created = studentService.createStudent(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Student created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> updateStudent(
            @PathVariable Integer id, @Valid @RequestBody StudentRequestDTO dto) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Student updated successfully", studentService.updateStudent(id, dto)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/place")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> markAsPlaced(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Student marked as placed", studentService.markAsPlaced(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{studentId}/skills/{skillId}")
    public ResponseEntity<ApiResponse<StudentSkill>> addSkillToStudent(
            @PathVariable Integer studentId,
            @PathVariable Integer skillId,
            @RequestParam String proficiencyLevel) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Skill added to student",
                skillService.addSkillToStudent(studentId, skillId, proficiencyLevel)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{studentId}/skills")
    public ResponseEntity<ApiResponse<List<StudentSkill>>> getStudentSkills(@PathVariable Integer studentId) {
        return ResponseEntity.ok(ApiResponse.success("Student skills fetched successfully",
            skillService.getStudentSkills(studentId)));
    }
}