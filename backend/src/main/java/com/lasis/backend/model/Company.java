package com.lasis.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Integer companyId;

    @Column(name = "company_name", nullable = false, unique = true, length = 150)
    private String companyName;

    @Column(name = "sector", nullable = false, length = 100)
    private String sector;

    @Column(name = "company_type", nullable = false, length = 50)
    private String companyType;

    @Column(name = "funding_stage", length = 50)
    private String fundingStage;

    @Column(name = "headquarters", length = 100)
    private String headquarters;

    @Column(name = "website", length = 200)
    private String website;

    @Column(name = "is_active_recruiter")
    private Boolean isActiveRecruiter = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
