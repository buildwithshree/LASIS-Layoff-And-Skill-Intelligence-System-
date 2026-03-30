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
@Table(name = "risk_signals")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RiskSignal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "signal_id")
    private Integer signalId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "signal_type", nullable = false, length = 50)
    private String signalType;

    @Column(name = "signal_source", length = 100)
    private String signalSource;

    @Column(name = "headline", nullable = false)
    private String headline;

    @Column(name = "severity_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal severityScore;

    @Column(name = "affected_count")
    private Integer affectedCount = 0;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "signal_date", nullable = false)
    private LocalDate signalDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}