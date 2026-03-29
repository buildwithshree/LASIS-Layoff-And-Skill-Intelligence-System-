package com.lasis.backend.controller;

import com.lasis.backend.model.Company;
import com.lasis.backend.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/companies")
@CrossOrigin(origins = "*")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @GetMapping
    public List<Company> getAllCompanies() {
        return companyService.getAllCompanies();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Company> getCompanyById(@PathVariable Integer id) {
        return companyService.getCompanyById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public List<Company> getActiveCompanies() {
        return companyService.getActiveCompanies();
    }

    @GetMapping("/sector/{sector}")
    public List<Company> getCompaniesBySector(@PathVariable String sector) {
        return companyService.getCompaniesBySector(sector);
    }

    @GetMapping("/type/{type}")
    public List<Company> getCompaniesByType(@PathVariable String type) {
        return companyService.getCompaniesByType(type);
    }

    @PostMapping
    public Company createCompany(@RequestBody Company company) {
        return companyService.createCompany(company);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Company> updateCompany(@PathVariable Integer id,
                                                  @RequestBody Company company) {
        try {
            return ResponseEntity.ok(companyService.updateCompany(id, company));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}