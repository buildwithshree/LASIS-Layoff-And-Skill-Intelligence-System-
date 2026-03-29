package com.lasis.backend.repository;

import com.lasis.backend.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Integer> {
    Optional<Skill> findBySkillNameIgnoreCase(String skillName);
    List<Skill> findByCategory(String category);
    List<Skill> findByDemandLevel(String demandLevel);
    List<Skill> findByCategoryAndDemandLevel(String category, String demandLevel);
}
