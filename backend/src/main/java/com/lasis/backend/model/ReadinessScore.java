package com.lasis.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "readiness_scores")
public class ReadinessScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "score_id")
    private Integer scoreId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private JobPosting jobPosting;

    @Column(name = "skill_match_score", precision = 5, scale = 2)
    private BigDecimal skillMatchScore = BigDecimal.ZERO;

    @Column(name = "gpa_weight", precision = 5, scale = 2)
    private BigDecimal gpaWeight = BigDecimal.ZERO;

    @Column(name = "project_score", precision = 5, scale = 2)
    private BigDecimal projectScore = BigDecimal.ZERO;

    @Column(name = "company_risk_score", precision = 5, scale = 2)
    private BigDecimal companyRiskScore = BigDecimal.ZERO;

    @Column(name = "gap_score", precision = 5, scale = 2)
    private BigDecimal gapScore = BigDecimal.ZERO;

    @Column(name = "final_readiness", precision = 5, scale = 2)
    private BigDecimal finalReadiness = BigDecimal.ZERO;

    @Column(name = "readiness_level", length = 20)
    private String readinessLevel = "low";

    @Column(name = "missing_skills", columnDefinition = "TEXT")
    private String missingSkills;

    @Column(name = "recommendation", columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @PrePersist
    protected void onCreate() {
        calculatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        calculatedAt = LocalDateTime.now();
    }
}

