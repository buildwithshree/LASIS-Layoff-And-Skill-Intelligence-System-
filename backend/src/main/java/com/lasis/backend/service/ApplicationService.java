package com.lasis.backend.service;

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

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    public Application applyToJob(Integer studentId, Integer jobId) {
        if (applicationRepository.existsByStudentStudentIdAndJobPostingJobId(studentId, jobId)) {
            throw new RuntimeException("Student already applied to this job");
        }

        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        JobPosting job = jobPostingRepository.findById(jobId)
            .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        if (!job.getIsActive()) {
            throw new RuntimeException("Job posting is no longer active");
        }

        if (student.getGpa().compareTo(job.getRequiredGpa()) < 0) {
            throw new RuntimeException("Student GPA does not meet minimum requirement");
        }

        if (student.getBacklogs() > job.getMaxBacklogs()) {
            throw new RuntimeException("Student backlogs exceed maximum allowed");
        }

        Application application = new Application();
        application.setStudent(student);
        application.setJobPosting(job);
        application.setStatus("applied");
        return applicationRepository.save(application);
    }

    public List<Application> getApplicationsByStudent(Integer studentId) {
        return applicationRepository.findByStudentStudentId(studentId);
    }

    public List<Application> getApplicationsByJob(Integer jobId) {
        return applicationRepository.findByJobPostingJobId(jobId);
    }

    public Optional<Application> getApplicationById(Integer id) {
        return applicationRepository.findById(id);
    }

    public Application updateApplicationStatus(Integer applicationId, String status) {
        return applicationRepository.findById(applicationId).map(application -> {
            application.setStatus(status);
            if (status.equals("selected")) {
                application.getStudent().setIsPlaced(true);
                studentRepository.save(application.getStudent());
            }
            return applicationRepository.save(application);
        }).orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));
    }

    public List<Application> getApplicationsByStatus(String status) {
        return applicationRepository.findByStatus(status);
    }
}
