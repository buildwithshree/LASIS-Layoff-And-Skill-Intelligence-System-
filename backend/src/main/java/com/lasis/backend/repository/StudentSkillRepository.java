package com.lasis.backend.repository;

import com.lasis.backend.model.StudentSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentSkillRepository extends JpaRepository<StudentSkill, Integer> {
    List<StudentSkill> findByStudentStudentId(Integer studentId);
    List<StudentSkill> findBySkillSkillId(Integer skillId);
    Optional<StudentSkill> findByStudentStudentIdAndSkillSkillId(Integer studentId, Integer skillId);

    @Query("SELECT ss FROM StudentSkill ss WHERE ss.student.studentId = :studentId AND ss.proficiencyLevel IN ('advanced', 'expert')")
    List<StudentSkill> findStrongSkillsByStudent(@Param("studentId") Integer studentId);

    boolean existsByStudentStudentIdAndSkillSkillId(Integer studentId, Integer skillId);
}
