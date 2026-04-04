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
        return ResponseEntity.ok(ApiResponse.success("Companies fetched successfully",
            companyService.getAllCompanies()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponseDTO>> getCompanyById(@PathVariable Integer id) {
        return companyService.getCompanyById(id)
            .map(c -> ResponseEntity.ok(ApiResponse.success("Company fetched successfully", c)))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Company not found with id: " + id)));
    }

    @GetMapping("/recruiter/by-email/{email}")
    public ResponseEntity<ApiResponse<CompanyResponseDTO>> getCompanyByRecruiterEmail(
            @PathVariable String email) {
        return companyService.getCompanyByRecruiterEmail(email)
            .map(c -> ResponseEntity.ok(ApiResponse.success("Company fetched successfully", c)))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("No company linked to recruiter email: " + email)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CompanyResponseDTO>>> getActiveCompanies() {
        return ResponseEntity.ok(ApiResponse.success("Active companies fetched successfully",
            companyService.getActiveCompanies()));
    }

    @GetMapping("/sector/{sector}")
    public ResponseEntity<ApiResponse<List<CompanyResponseDTO>>> getCompaniesBySector(
            @PathVariable String sector) {
        return ResponseEntity.ok(ApiResponse.success("Companies fetched successfully",
            companyService.getCompaniesBySector(sector)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompanyResponseDTO>> createCompany(
            @Valid @RequestBody CompanyRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Company created successfully",
                companyService.createCompany(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponseDTO>> updateCompany(
            @PathVariable Integer id, @Valid @RequestBody CompanyRequestDTO dto) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Company updated successfully",
                companyService.updateCompany(id, dto)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}