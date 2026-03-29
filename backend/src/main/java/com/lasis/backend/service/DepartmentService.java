package com.lasis.backend.service;

import com.lasis.backend.model.Department;
import com.lasis.backend.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Optional<Department> getDepartmentById(Integer id) {
        return departmentRepository.findById(id);
    }

    public Optional<Department> getDepartmentByCode(String code) {
        return departmentRepository.findByDeptCode(code);
    }

    public Department createDepartment(Department department) {
        return departmentRepository.save(department);
    }

    public Department updateDepartment(Integer id, Department updated) {
        return departmentRepository.findById(id).map(dept -> {
            dept.setDeptName(updated.getDeptName());
            dept.setDeptCode(updated.getDeptCode());
            return departmentRepository.save(dept);
        }).orElseThrow(() -> new RuntimeException("Department not found: " + id));
    }

    public void deleteDepartment(Integer id) {
        departmentRepository.deleteById(id);
    }
}
