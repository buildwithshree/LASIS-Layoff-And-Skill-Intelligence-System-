package com.lasis.backend.service;

import com.lasis.backend.model.Department;
import com.lasis.backend.model.Student;
import com.lasis.backend.repository.DepartmentRepository;
import com.lasis.backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(Integer id) {
        return studentRepository.findById(id);
    }

    public Optional<Student> getStudentByEmail(String email) {
        return studentRepository.findByEmail(email);
    }

    public List<Student> getUnplacedStudents() {
        return studentRepository.findByIsPlacedFalse();
    }

    public List<Student> getEligibleStudents(BigDecimal minGpa, Integer maxBacklogs) {
        return studentRepository.findEligibleStudents(minGpa, maxBacklogs);
    }

    public List<Student> getStudentsByDepartment(Integer departmentId) {
        return studentRepository.findByDepartmentDepartmentId(departmentId);
    }

    public Student createStudent(Student student) {
        return studentRepository.save(student);
    }

    public Student updateStudent(Integer id, Student updated) {
        return studentRepository.findById(id).map(student -> {
            student.setFullName(updated.getFullName());
            student.setEmail(updated.getEmail());
            student.setPhone(updated.getPhone());
            student.setGpa(updated.getGpa());
            student.setGraduationYear(updated.getGraduationYear());
            student.setBacklogs(updated.getBacklogs());
            student.setResumeUrl(updated.getResumeUrl());
            student.setProjectScore(updated.getProjectScore());
            student.setIsPlaced(updated.getIsPlaced());
            student.setIsActive(updated.getIsActive());
            if (updated.getDepartment() != null) {
                Department dept = departmentRepository
                    .findById(updated.getDepartment().getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
                student.setDepartment(dept);
            }
            return studentRepository.save(student);
        }).orElseThrow(() -> new RuntimeException("Student not found: " + id));
    }

    public Student markAsPlaced(Integer studentId) {
        return studentRepository.findById(studentId).map(student -> {
            student.setIsPlaced(true);
            return studentRepository.save(student);
        }).orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
    }
}