package com.lasis.backend.service;

import com.lasis.backend.model.Company;
import com.lasis.backend.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public Optional<Company> getCompanyById(Integer id) {
        return companyRepository.findById(id);
    }

    public List<Company> getActiveCompanies() {
        return companyRepository.findByIsActiveRecruiterTrue();
    }

    public List<Company> getCompaniesBySector(String sector) {
        return companyRepository.findBySector(sector);
    }

    public List<Company> getCompaniesByType(String type) {
        return companyRepository.findByCompanyType(type);
    }

    public Company createCompany(Company company) {
        return companyRepository.save(company);
    }

    public Company updateCompany(Integer id, Company updated) {
        return companyRepository.findById(id).map(company -> {
            company.setCompanyName(updated.getCompanyName());
            company.setSector(updated.getSector());
            company.setCompanyType(updated.getCompanyType());
            company.setFundingStage(updated.getFundingStage());
            company.setHeadquarters(updated.getHeadquarters());
            company.setWebsite(updated.getWebsite());
            company.setIsActiveRecruiter(updated.getIsActiveRecruiter());
            return companyRepository.save(company);
        }).orElseThrow(() -> new RuntimeException("Company not found: " + id));
    }
}
