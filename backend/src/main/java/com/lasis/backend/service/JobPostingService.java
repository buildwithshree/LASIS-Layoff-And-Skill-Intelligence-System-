package com.lasis.backend.service;

import com.lasis.backend.model.JobPosting;
import com.lasis.backend.repository.JobPostingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class JobPostingService {

    @Autowired
    private JobPostingRepository jobPostingRepository;

    public List<JobPosting> getAllJobs() {
        return jobPostingRepository.findAll();
    }

    public Optional<JobPosting> getJobById(Integer id) {
        return jobPostingRepository.findById(id);
    }

    public List<JobPosting> getActiveJobs() {
        return jobPostingRepository.findByIsActiveTrue();
    }

    public List<JobPosting> getJobsByCompany(Integer companyId) {
        return jobPostingRepository.findByCompanyCompanyId(companyId);
    }

    public List<JobPosting> getEligibleJobs(BigDecimal gpa, Integer backlogs) {
        return jobPostingRepository.findEligibleJobs(gpa, backlogs);
    }

    public List<JobPosting> searchJobsByTitle(String keyword) {
        return jobPostingRepository.findByJobTitleContainingIgnoreCase(keyword);
    }

    public JobPosting createJobPosting(JobPosting jobPosting) {
        return jobPostingRepository.save(jobPosting);
    }

    public JobPosting updateJobPosting(Integer id, JobPosting updated) {
        return jobPostingRepository.findById(id).map(job -> {
            job.setJobTitle(updated.getJobTitle());
            job.setJobDescription(updated.getJobDescription());
            job.setRequiredSkills(updated.getRequiredSkills());
            job.setSalaryMin(updated.getSalaryMin());
            job.setSalaryMax(updated.getSalaryMax());
            job.setRequiredGpa(updated.getRequiredGpa());
            job.setMaxBacklogs(updated.getMaxBacklogs());
            job.setJobType(updated.getJobType());
            job.setExperienceRequired(updated.getExperienceRequired());
            job.setOpenings(updated.getOpenings());
            job.setApplicationDeadline(updated.getApplicationDeadline());
            job.setIsActive(updated.getIsActive());
            return jobPostingRepository.save(job);
        }).orElseThrow(() -> new RuntimeException("Job not found: " + id));
    }

    public JobPosting closeJobPosting(Integer id) {
        return jobPostingRepository.findById(id).map(job -> {
            job.setIsActive(false);
            return jobPostingRepository.save(job);
        }).orElseThrow(() -> new RuntimeException("Job not found: " + id));
    }
}
