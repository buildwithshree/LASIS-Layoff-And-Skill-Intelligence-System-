package com.lasis.backend.repository;

import com.lasis.backend.model.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Integer> {
    List<JobPosting> findByIsActiveTrue();
    List<JobPosting> findByCompanyCompanyId(Integer companyId);

    @Query("SELECT jp FROM JobPosting jp WHERE jp.isActive = true AND jp.requiredGpa <= :gpa AND jp.maxBacklogs >= :backlogs")
    List<JobPosting> findEligibleJobs(@Param("gpa") BigDecimal gpa,
                                      @Param("backlogs") Integer backlogs);

    @Query("SELECT jp FROM JobPosting jp WHERE jp.isActive = true ORDER BY jp.salaryMax DESC")
    List<JobPosting> findActiveJobsOrderBySalaryDesc();

    List<JobPosting> findByJobTitleContainingIgnoreCase(String keyword);
}
