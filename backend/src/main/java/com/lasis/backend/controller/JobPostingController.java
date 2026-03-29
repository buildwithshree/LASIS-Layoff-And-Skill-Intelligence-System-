package com.lasis.backend.controller;

import com.lasis.backend.model.JobPosting;
import com.lasis.backend.service.JobPostingService;
import org.springframework.beans.factory.annotation.Autowired;
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
    public List<JobPosting> getAllJobs() {
        return jobPostingService.getAllJobs();
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobPosting> getJobById(@PathVariable Integer id) {
        return jobPostingService.getJobById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public List<JobPosting> getActiveJobs() {
        return jobPostingService.getActiveJobs();
    }

    @GetMapping("/company/{companyId}")
    public List<JobPosting> getJobsByCompany(@PathVariable Integer companyId) {
        return jobPostingService.getJobsByCompany(companyId);
    }

    @GetMapping("/eligible")
    public List<JobPosting> getEligibleJobs(
            @RequestParam(defaultValue = "7.0") BigDecimal gpa,
            @RequestParam(defaultValue = "0") Integer backlogs) {
        return jobPostingService.getEligibleJobs(gpa, backlogs);
    }

    @GetMapping("/search")
    public List<JobPosting> searchJobs(@RequestParam String keyword) {
        return jobPostingService.searchJobsByTitle(keyword);
    }

    @PostMapping
    public JobPosting createJobPosting(@RequestBody JobPosting jobPosting) {
        return jobPostingService.createJobPosting(jobPosting);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobPosting> updateJobPosting(@PathVariable Integer id,
                                                        @RequestBody JobPosting jobPosting) {
        try {
            return ResponseEntity.ok(jobPostingService.updateJobPosting(id, jobPosting));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<JobPosting> closeJobPosting(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(jobPostingService.closeJobPosting(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
