package com.lasis.backend.repository;

import com.lasis.backend.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Integer> {
    Optional<Student> findByEmail(String email);
    List<Student> findByIsPlacedFalse();
    List<Student> findByIsActiveTrueAndIsPlacedFalse();
    List<Student> findByDepartmentDepartmentId(Integer departmentId);

    @Query("SELECT s FROM Student s WHERE s.gpa >= :minGpa AND s.backlogs <= :maxBacklogs AND s.isActive = true")
    List<Student> findEligibleStudents(@Param("minGpa") BigDecimal minGpa,
                                       @Param("maxBacklogs") Integer maxBacklogs);

    @Query("SELECT s FROM Student s WHERE s.graduationYear = :year AND s.isPlaced = false")
    List<Student> findUnplacedByYear(@Param("year") Integer year);
}
