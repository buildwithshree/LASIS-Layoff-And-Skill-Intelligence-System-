package com.lasis.backend.repository;

import com.lasis.backend.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Integer> {
    Optional<Department> findByDeptCode(String deptCode);
    Optional<Department> findByDeptName(String deptName);
}
