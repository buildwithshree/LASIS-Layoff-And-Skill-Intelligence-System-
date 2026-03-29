package com.lasis.backend.repository;

import com.lasis.backend.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    List<Application> findByStudentStudentId(Integer studentId);
    List<Application> findByJobPostingJobId(Integer jobId);
    List<Application> findByStatus(String status);
    Optional<Application> findByStudentStudentIdAndJobPostingJobId(Integer studentId, Integer jobId);
    boolean existsByStudentStudentIdAndJobPostingJobId(Integer studentId, Integer jobId);

    @Query("SELECT a FROM Application a WHERE a.student.studentId = :studentId AND a.status = :status")
    List<Application> findByStudentAndStatus(@Param("studentId") Integer studentId,
                                             @Param("status") String status);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.jobPosting.jobId = :jobId AND a.status = 'selected'")
    Long countSelectedByJob(@Param("jobId") Integer jobId);
}
