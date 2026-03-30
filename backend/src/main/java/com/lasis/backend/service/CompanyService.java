package com.lasis.backend.service;

import com.lasis.backend.dto.CompanyRequestDTO;
import com.lasis.backend.dto.CompanyResponseDTO;
import com.lasis.backend.model.Company;
import com.lasis.backend.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    private CompanyResponseDTO toDTO(Company company) {
        return new CompanyResponseDTO(
            company.getCompanyId(),
            company.getCompanyName(),
            company.getSector(),
            company.getCompanyType(),
            company.getFundingStage(),
            company.getHeadquarters(),
            company.getWebsite(),
            company.getIsActiveRecruiter(),
            company.getCreatedAt(),
            company.getUpdatedAt()
        );
    }

    private Company toEntity(CompanyRequestDTO dto) {
        Company company = new Company();
        company.setCompanyName(dto.getCompanyName());
        company.setSector(dto.getSector());
        company.setCompanyType(dto.getCompanyType());
        company.setFundingStage(dto.getFundingStage());
        company.setHeadquarters(dto.getHeadquarters());
        company.setWebsite(dto.getWebsite());
        company.setIsActiveRecruiter(dto.getIsActiveRecruiter());
        return company;
    }

    public List<CompanyResponseDTO> getAllCompanies() {
        return companyRepository.findAll()
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<CompanyResponseDTO> getCompanyById(Integer id) {
        return companyRepository.findById(id).map(this::toDTO);
    }

    public List<CompanyResponseDTO> getActiveCompanies() {
        return companyRepository.findByIsActiveRecruiterTrue()
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<CompanyResponseDTO> getCompaniesBySector(String sector) {
        return companyRepository.findBySector(sector)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<CompanyResponseDTO> getCompaniesByType(String type) {
        return companyRepository.findByCompanyType(type)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public CompanyResponseDTO createCompany(CompanyRequestDTO dto) {
        return toDTO(companyRepository.save(toEntity(dto)));
    }

    public CompanyResponseDTO updateCompany(Integer id, CompanyRequestDTO dto) {
        return companyRepository.findById(id).map(company -> {
            company.setCompanyName(dto.getCompanyName());
            company.setSector(dto.getSector());
            company.setCompanyType(dto.getCompanyType());
            company.setFundingStage(dto.getFundingStage());
            company.setHeadquarters(dto.getHeadquarters());
            company.setWebsite(dto.getWebsite());
            company.setIsActiveRecruiter(dto.getIsActiveRecruiter());
            return toDTO(companyRepository.save(company));
        }).orElseThrow(() -> new RuntimeException("Company not found: " + id));
    }

    // Used internally by other services (RiskService etc.)
    public Optional<Company> getCompanyEntityById(Integer id) {
        return companyRepository.findById(id);
    }
}