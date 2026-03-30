package com.lasis.backend.service;

import com.lasis.backend.dto.StudentRequestDTO;
import com.lasis.backend.dto.StudentResponseDTO;
import com.lasis.backend.model.Department;
import com.lasis.backend.model.Student;
import com.lasis.backend.repository.DepartmentRepository;
import com.lasis.backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    private StudentResponseDTO toDTO(Student s) {
        return new StudentResponseDTO(
            s.getStudentId(),
            s.getFullName(),
            s.getEmail(),
            s.getPhone(),
            s.getDepartment() != null ? s.getDepartment().getDepartmentId() : null,
            s.getDepartment() != null ? s.getDepartment().getDeptName() : null,
            s.getGpa(),
            s.getGraduationYear(),
            s.getBacklogs(),
            s.getResumeUrl(),
            s.getProjectScore(),
            s.getIsPlaced(),
            s.getIsActive(),
            s.getCreatedAt(),
            s.getUpdatedAt()
        );
    }

    private Student toEntity(StudentRequestDTO dto) {
        Department dept = departmentRepository.findById(dto.getDepartmentId())
            .orElseThrow(() -> new RuntimeException("Department not found: " + dto.getDepartmentId()));
        Student student = new Student();
        student.setFullName(dto.getFullName());
        student.setEmail(dto.getEmail());
        student.setPhone(dto.getPhone());
        student.setDepartment(dept);
        student.setGpa(dto.getGpa());
        student.setGraduationYear(dto.getGraduationYear());
        student.setBacklogs(dto.getBacklogs());
        student.setResumeUrl(dto.getResumeUrl());
        student.setProjectScore(dto.getProjectScore());
        student.setIsPlaced(dto.getIsPlaced());
        student.setIsActive(dto.getIsActive());
        return student;
    }

    public List<StudentResponseDTO> getAllStudents() {
        return studentRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<StudentResponseDTO> getStudentById(Integer id) {
        return studentRepository.findById(id).map(this::toDTO);
    }

    public List<StudentResponseDTO> getUnplacedStudents() {
        return studentRepository.findByIsPlacedFalse().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<StudentResponseDTO> getEligibleStudents(BigDecimal minGpa, Integer maxBacklogs) {
        return studentRepository.findEligibleStudents(minGpa, maxBacklogs).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<StudentResponseDTO> getStudentsByDepartment(Integer departmentId) {
        return studentRepository.findByDepartmentDepartmentId(departmentId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public StudentResponseDTO createStudent(StudentRequestDTO dto) {
        return toDTO(studentRepository.save(toEntity(dto)));
    }

    public StudentResponseDTO updateStudent(Integer id, StudentRequestDTO dto) {
        return studentRepository.findById(id).map(student -> {
            Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found: " + dto.getDepartmentId()));
            student.setFullName(dto.getFullName());
            student.setEmail(dto.getEmail());
            student.setPhone(dto.getPhone());
            student.setDepartment(dept);
            student.setGpa(dto.getGpa());
            student.setGraduationYear(dto.getGraduationYear());
            student.setBacklogs(dto.getBacklogs());
            student.setResumeUrl(dto.getResumeUrl());
            student.setProjectScore(dto.getProjectScore());
            student.setIsPlaced(dto.getIsPlaced());
            student.setIsActive(dto.getIsActive());
            return toDTO(studentRepository.save(student));
        }).orElseThrow(() -> new RuntimeException("Student not found: " + id));
    }

    public StudentResponseDTO markAsPlaced(Integer studentId) {
        return studentRepository.findById(studentId).map(student -> {
            student.setIsPlaced(true);
            return toDTO(studentRepository.save(student));
        }).orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
    }

    // Used internally by other services
    public Optional<Student> getStudentEntityById(Integer id) {
        return studentRepository.findById(id);
    }
}