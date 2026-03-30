package com.lasis.backend.service;

import com.lasis.backend.dto.JobPostingRequestDTO;
import com.lasis.backend.dto.JobPostingResponseDTO;
import com.lasis.backend.model.Company;
import com.lasis.backend.model.JobPosting;
import com.lasis.backend.repository.CompanyRepository;
import com.lasis.backend.repository.JobPostingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class JobPostingService {

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private CompanyRepository companyRepository;

    private JobPostingResponseDTO toDTO(JobPosting j) {
        return new JobPostingResponseDTO(
            j.getJobId(),
            j.getCompany() != null ? j.getCompany().getCompanyId() : null,
            j.getCompany() != null ? j.getCompany().getCompanyName() : null,
            j.getJobTitle(),
            j.getJobDescription(),
            j.getRequiredSkills(),
            j.getSalaryMin(),
            j.getSalaryMax(),
            j.getRequiredGpa(),
            j.getMaxBacklogs(),
            j.getJobType(),
            j.getExperienceRequired(),
            j.getOpenings(),
            j.getApplicationDeadline(),
            j.getIsActive(),
            j.getPostedAt(),
            j.getUpdatedAt()
        );
    }

    private JobPosting toEntity(JobPostingRequestDTO dto) {
        Company company = companyRepository.findById(dto.getCompanyId())
            .orElseThrow(() -> new RuntimeException("Company not found: " + dto.getCompanyId()));
        JobPosting job = new JobPosting();
        job.setCompany(company);
        job.setJobTitle(dto.getJobTitle());
        job.setJobDescription(dto.getJobDescription());
        job.setRequiredSkills(dto.getRequiredSkills());
        job.setSalaryMin(dto.getSalaryMin());
        job.setSalaryMax(dto.getSalaryMax());
        job.setRequiredGpa(dto.getRequiredGpa());
        job.setMaxBacklogs(dto.getMaxBacklogs());
        job.setJobType(dto.getJobType());
        job.setExperienceRequired(dto.getExperienceRequired());
        job.setOpenings(dto.getOpenings());
        job.setApplicationDeadline(dto.getApplicationDeadline());
        job.setIsActive(dto.getIsActive());
        return job;
    }

    public List<JobPostingResponseDTO> getAllJobs() {
        return jobPostingRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<JobPostingResponseDTO> getJobById(Integer id) {
        return jobPostingRepository.findById(id).map(this::toDTO);
    }

    public List<JobPostingResponseDTO> getActiveJobs() {
        return jobPostingRepository.findByIsActiveTrue().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<JobPostingResponseDTO> getJobsByCompany(Integer companyId) {
        return jobPostingRepository.findByCompanyCompanyId(companyId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<JobPostingResponseDTO> getEligibleJobs(BigDecimal gpa, Integer backlogs) {
        return jobPostingRepository.findEligibleJobs(gpa, backlogs).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<JobPostingResponseDTO> searchJobsByTitle(String keyword) {
        return jobPostingRepository.findByJobTitleContainingIgnoreCase(keyword).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public JobPostingResponseDTO createJobPosting(JobPostingRequestDTO dto) {
        return toDTO(jobPostingRepository.save(toEntity(dto)));
    }

    public JobPostingResponseDTO updateJobPosting(Integer id, JobPostingRequestDTO dto) {
        return jobPostingRepository.findById(id).map(job -> {
            Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found: " + dto.getCompanyId()));
            job.setCompany(company);
            job.setJobTitle(dto.getJobTitle());
            job.setJobDescription(dto.getJobDescription());
            job.setRequiredSkills(dto.getRequiredSkills());
            job.setSalaryMin(dto.getSalaryMin());
            job.setSalaryMax(dto.getSalaryMax());
            job.setRequiredGpa(dto.getRequiredGpa());
            job.setMaxBacklogs(dto.getMaxBacklogs());
            job.setJobType(dto.getJobType());
            job.setExperienceRequired(dto.getExperienceRequired());
            job.setOpenings(dto.getOpenings());
            job.setApplicationDeadline(dto.getApplicationDeadline());
            job.setIsActive(dto.getIsActive());
            return toDTO(jobPostingRepository.save(job));
        }).orElseThrow(() -> new RuntimeException("Job not found: " + id));
    }

    public JobPostingResponseDTO closeJobPosting(Integer id) {
        return jobPostingRepository.findById(id).map(job -> {
            job.setIsActive(false);
            return toDTO(jobPostingRepository.save(job));
        }).orElseThrow(() -> new RuntimeException("Job not found: " + id));
    }

    // Used internally by ReadinessService
    public Optional<JobPosting> getJobEntityById(Integer id) {
        return jobPostingRepository.findById(id);
    }
}