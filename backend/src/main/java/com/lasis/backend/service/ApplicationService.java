package com.lasis.backend.service;

import com.lasis.backend.dto.ApplicationResponseDTO;
import com.lasis.backend.model.Application;
import com.lasis.backend.model.JobPosting;
import com.lasis.backend.model.Student;
import com.lasis.backend.repository.ApplicationRepository;
import com.lasis.backend.repository.JobPostingRepository;
import com.lasis.backend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    // ─── Mapper: Entity → DTO ───────────────────────────────────────────
    private ApplicationResponseDTO toDTO(Application application) {
        ApplicationResponseDTO dto = new ApplicationResponseDTO();
        dto.setApplicationId(application.getApplicationId());
        dto.setStudentId(application.getStudent().getStudentId());
        dto.setStudentName(application.getStudent().getFullName());
        dto.setJobId(application.getJobPosting().getJobId());
        dto.setJobTitle(application.getJobPosting().getJobTitle());
        dto.setCompanyName(application.getJobPosting().getCompany().getCompanyName());
        dto.setStatus(application.getStatus());
        dto.setNotes(application.getNotes());
        dto.setAppliedAt(application.getAppliedAt());
        dto.setUpdatedAt(application.getUpdatedAt());
        return dto;
    }

    // ─── Public Service Methods ─────────────────────────────────────────
    public ApplicationResponseDTO applyToJob(Integer studentId, Integer jobId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        boolean alreadyApplied = applicationRepository.findAll()
                .stream()
                .anyMatch(a -> a.getStudent().getStudentId().equals(studentId)
                        && a.getJobPosting().getJobId().equals(jobId));

        if (alreadyApplied) {
            throw new RuntimeException("Student " + studentId + " has already applied to job " + jobId);
        }

        Application application = new Application();
        application.setStudent(student);
        application.setJobPosting(job);
        application.setStatus("applied");
        Application saved = applicationRepository.save(application);
        return toDTO(saved);
    }

    public List<ApplicationResponseDTO> getApplicationsByStudent(Integer studentId) {
        return applicationRepository.findAll()
                .stream()
                .filter(a -> a.getStudent().getStudentId().equals(studentId))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ApplicationResponseDTO> getApplicationsByJob(Integer jobId) {
        return applicationRepository.findAll()
                .stream()
                .filter(a -> a.getJobPosting().getJobId().equals(jobId))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<ApplicationResponseDTO> getApplicationById(Integer id) {
        return applicationRepository.findById(id)
                .map(this::toDTO);
    }

    public List<ApplicationResponseDTO> getApplicationsByStatus(String status) {
        return applicationRepository.findAll()
                .stream()
                .filter(a -> a.getStatus().equalsIgnoreCase(status))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ApplicationResponseDTO updateApplicationStatus(Integer applicationId, String status) {
        Application existing = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));
        existing.setStatus(status);
        Application updated = applicationRepository.save(existing);
        return toDTO(updated);
    }
}