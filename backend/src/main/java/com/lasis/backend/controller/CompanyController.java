package com.lasis.backend.controller;

import com.lasis.backend.dto.ApiResponse;
import com.lasis.backend.dto.CompanyRequestDTO;
import com.lasis.backend.dto.CompanyResponseDTO;
import com.lasis.backend.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/companies")
@CrossOrigin(origins = "*")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CompanyResponseDTO>>> getAllCompanies() {
        List<CompanyResponseDTO> companies = companyService.getAllCompanies();
        return ResponseEntity.ok(ApiResponse.success("Companies fetched successfully", companies));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponseDTO>> getCompanyById(@PathVariable Integer id) {
        return companyService.getCompanyById(id)
            .map(company -> ResponseEntity.ok(ApiResponse.success("Company fetched successfully", company)))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Company not found with id: " + id)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CompanyResponseDTO>>> getActiveCompanies() {
        List<CompanyResponseDTO> companies = companyService.getActiveCompanies();
        return ResponseEntity.ok(ApiResponse.success("Active companies fetched successfully", companies));
    }

    @GetMapping("/sector/{sector}")
    public ResponseEntity<ApiResponse<List<CompanyResponseDTO>>> getCompaniesBySector(@PathVariable String sector) {
        List<CompanyResponseDTO> companies = companyService.getCompaniesBySector(sector);
        return ResponseEntity.ok(ApiResponse.success("Companies in sector '" + sector + "' fetched successfully", companies));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<CompanyResponseDTO>>> getCompaniesByType(@PathVariable String type) {
        List<CompanyResponseDTO> companies = companyService.getCompaniesByType(type);
        return ResponseEntity.ok(ApiResponse.success("Companies of type '" + type + "' fetched successfully", companies));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompanyResponseDTO>> createCompany(@Valid @RequestBody CompanyRequestDTO dto) {
        CompanyResponseDTO created = companyService.createCompany(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Company created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponseDTO>> updateCompany(
            @PathVariable Integer id,
            @Valid @RequestBody CompanyRequestDTO dto) {
        try {
            CompanyResponseDTO updated = companyService.updateCompany(id, dto);
            return ResponseEntity.ok(ApiResponse.success("Company updated successfully", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}