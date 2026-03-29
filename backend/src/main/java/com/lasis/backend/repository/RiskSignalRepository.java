package com.lasis.backend.repository;

import com.lasis.backend.model.RiskSignal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RiskSignalRepository extends JpaRepository<RiskSignal, Integer> {
    List<RiskSignal> findByCompanyCompanyId(Integer companyId);
    List<RiskSignal> findBySignalType(String signalType);
    List<RiskSignal> findByIsVerifiedTrue();

    @Query("SELECT rs FROM RiskSignal rs WHERE rs.company.companyId = :companyId ORDER BY rs.signalDate DESC")
    List<RiskSignal> findByCompanyOrderByDateDesc(@Param("companyId") Integer companyId);

    @Query("SELECT rs FROM RiskSignal rs WHERE rs.severityScore >= :minSeverity ORDER BY rs.severityScore DESC")
    List<RiskSignal> findHighSeveritySignals(@Param("minSeverity") Double minSeverity);
}