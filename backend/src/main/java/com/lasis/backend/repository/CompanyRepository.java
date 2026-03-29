package com.lasis.backend.repository;

import com.lasis.backend.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Integer> {
    Optional<Company> findByCompanyName(String companyName);
    List<Company> findByIsActiveRecruiterTrue();
    List<Company> findBySector(String sector);
    List<Company> findByCompanyType(String companyType);
}
