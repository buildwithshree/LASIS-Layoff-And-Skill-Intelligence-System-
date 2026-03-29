package com.lasis.backend.repository;

import com.lasis.backend.model.ReadinessScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReadinessScoreRepository extends JpaRepository<ReadinessScore, Integer> {
    Optional<ReadinessScore> findByStudentStudentIdAndJobPostingJobId(Integer studentId, Integer jobId);
    List<ReadinessScore> findByStudentStudentId(Integer studentId);
    List<ReadinessScore> findByJobPostingJobId(Integer jobId);
    List<ReadinessScore> findByReadinessLevel(String readinessLevel);

    @Query("SELECT rs FROM ReadinessScore rs WHERE rs.student.studentId = :studentId ORDER BY rs.finalReadiness DESC")
    List<ReadinessScore> findByStudentOrderByScoreDesc(@Param("studentId") Integer studentId);

    @Query("SELECT rs FROM ReadinessScore rs WHERE rs.finalReadiness >= :minScore ORDER BY rs.finalReadiness DESC")
    List<ReadinessScore> findByMinReadinessScore(@Param("minScore") Double minScore);
}


