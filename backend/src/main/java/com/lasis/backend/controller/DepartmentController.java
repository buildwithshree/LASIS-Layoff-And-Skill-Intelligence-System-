package com.lasis.backend.controller;

import com.lasis.backend.dto.ApiResponse;
import com.lasis.backend.dto.DepartmentRequestDTO;
import com.lasis.backend.dto.DepartmentResponseDTO;
import com.lasis.backend.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentResponseDTO>>> getAllDepartments() {
        List<DepartmentResponseDTO> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(ApiResponse.success("Departments fetched successfully", departments));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponseDTO>> getDepartmentById(@PathVariable Integer id) {
        return departmentService.getDepartmentById(id)
                .map(dto -> ResponseEntity.ok(ApiResponse.success("Department fetched successfully", dto)))
                .orElse(ResponseEntity.status(404).body(ApiResponse.error("Department not found with id: " + id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentResponseDTO>> createDepartment(
            @Valid @RequestBody DepartmentRequestDTO requestDTO) {
        DepartmentResponseDTO created = departmentService.createDepartment(requestDTO);
        return ResponseEntity.status(201).body(ApiResponse.success("Department created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponseDTO>> updateDepartment(
            @PathVariable Integer id,
            @Valid @RequestBody DepartmentRequestDTO requestDTO) {
        DepartmentResponseDTO updated = departmentService.updateDepartment(id, requestDTO);
        return ResponseEntity.ok(ApiResponse.success("Department updated successfully", updated));
    }
}