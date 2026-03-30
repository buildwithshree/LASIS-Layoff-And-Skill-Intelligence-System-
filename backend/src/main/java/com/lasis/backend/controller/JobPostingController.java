package com.lasis.backend.controller;

import com.lasis.backend.dto.ApiResponse;
import com.lasis.backend.dto.JobPostingRequestDTO;
import com.lasis.backend.dto.JobPostingResponseDTO;
import com.lasis.backend.service.JobPostingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class JobPostingController {

    @Autowired
    private JobPostingService jobPostingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobPostingResponseDTO>>> getAllJobs() {
        return ResponseEntity.ok(ApiResponse.success("Jobs fetched successfully", jobPostingService.getAllJobs()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobPostingResponseDTO>> getJobById(@PathVariable Integer id) {
        return jobPostingService.getJobById(id)
            .map(j -> ResponseEntity.ok(ApiResponse.success("Job fetched successfully", j)))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Job not found with id: " + id)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<JobPostingResponseDTO>>> getActiveJobs() {
        return ResponseEntity.ok(ApiResponse.success("Active jobs fetched successfully", jobPostingService.getActiveJobs()));
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<ApiResponse<List<JobPostingResponseDTO>>> getJobsByCompany(@PathVariable Integer companyId) {
        return ResponseEntity.ok(ApiResponse.success("Jobs fetched successfully", jobPostingService.getJobsByCompany(companyId)));
    }

    @GetMapping("/eligible")
    public ResponseEntity<ApiResponse<List<JobPostingResponseDTO>>> getEligibleJobs(
            @RequestParam(defaultValue = "7.0") BigDecimal gpa,
            @RequestParam(defaultValue = "0") Integer backlogs) {
        return ResponseEntity.ok(ApiResponse.success("Eligible jobs fetched successfully",
            jobPostingService.getEligibleJobs(gpa, backlogs)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<JobPostingResponseDTO>>> searchJobs(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success("Search results fetched successfully",
            jobPostingService.searchJobsByTitle(keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<JobPostingResponseDTO>> createJobPosting(@Valid @RequestBody JobPostingRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Job posting created successfully", jobPostingService.createJobPosting(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobPostingResponseDTO>> updateJobPosting(
            @PathVariable Integer id, @Valid @RequestBody JobPostingRequestDTO dto) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Job posting updated successfully", jobPostingService.updateJobPosting(id, dto)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<ApiResponse<JobPostingResponseDTO>> closeJobPosting(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Job posting closed", jobPostingService.closeJobPosting(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
        }
    }
}