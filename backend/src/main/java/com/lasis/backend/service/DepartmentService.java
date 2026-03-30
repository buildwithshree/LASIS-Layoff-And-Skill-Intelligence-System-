package com.lasis.backend.service;

import com.lasis.backend.dto.DepartmentRequestDTO;
import com.lasis.backend.dto.DepartmentResponseDTO;
import com.lasis.backend.model.Department;
import com.lasis.backend.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    // ─── Mapper: Entity → DTO ───────────────────────────────────────────
    private DepartmentResponseDTO toDTO(Department department) {
        DepartmentResponseDTO dto = new DepartmentResponseDTO();
        dto.setDepartmentId(department.getDepartmentId());
        dto.setDeptName(department.getDeptName());
        dto.setDeptCode(department.getDeptCode());
        dto.setCreatedAt(department.getCreatedAt());
        return dto;
    }

    // ─── Mapper: DTO → Entity ───────────────────────────────────────────
    private Department toEntity(DepartmentRequestDTO dto) {
        Department department = new Department();
        department.setDeptName(dto.getDeptName());
        department.setDeptCode(dto.getDeptCode());
        return department;
    }

    // ─── Public Service Methods ─────────────────────────────────────────
    public List<DepartmentResponseDTO> getAllDepartments() {
        return departmentRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<DepartmentResponseDTO> getDepartmentById(Integer id) {
        return departmentRepository.findById(id)
                .map(this::toDTO);
    }

    public DepartmentResponseDTO createDepartment(DepartmentRequestDTO requestDTO) {
        Department department = toEntity(requestDTO);
        Department saved = departmentRepository.save(department);
        return toDTO(saved);
    }

    public DepartmentResponseDTO updateDepartment(Integer id, DepartmentRequestDTO requestDTO) {
        Department existing = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
        existing.setDeptName(requestDTO.getDeptName());
        existing.setDeptCode(requestDTO.getDeptCode());
        Department updated = departmentRepository.save(existing);
        return toDTO(updated);
    }

    // ─── Internal use only ──────────────────────────────────────────────
    public Optional<Department> getDepartmentEntityById(Integer id) {
        return departmentRepository.findById(id);
    }
}