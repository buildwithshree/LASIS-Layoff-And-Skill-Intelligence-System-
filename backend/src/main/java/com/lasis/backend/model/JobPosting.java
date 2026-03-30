package com.lasis.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "job_postings")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class JobPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "job_id")
    private Integer jobId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "job_title", nullable = false, length = 150)
    private String jobTitle;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "required_skills", nullable = false, columnDefinition = "TEXT")
    private String requiredSkills;

    @Column(name = "salary_min", precision = 10, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 10, scale = 2)
    private BigDecimal salaryMax;

    @Column(name = "required_gpa", precision = 3, scale = 2)
    private BigDecimal requiredGpa = new BigDecimal("6.0");

    @Column(name = "max_backlogs")
    private Integer maxBacklogs = 0;

    @Column(name = "job_type", length = 50)
    private String jobType = "Full-Time";

    @Column(name = "experience_required", length = 50)
    private String experienceRequired = "Fresher";

    @Column(name = "openings")
    private Integer openings = 1;

    @Column(name = "application_deadline")
    private LocalDate applicationDeadline;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "posted_at", updatable = false)
    private LocalDateTime postedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        postedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}