package com.lasis.backend.service;

import com.lasis.backend.dto.ReadinessResponseDTO;
import com.lasis.backend.model.*;
import com.lasis.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReadinessService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private StudentSkillRepository studentSkillRepository;

    @Autowired
    private CompanyRiskProfileRepository riskProfileRepository;

    @Autowired
    private ReadinessScoreRepository readinessScoreRepository;

    @Autowired
    private SkillRepository skillRepository;

    private ReadinessResponseDTO toDTO(ReadinessScore s) {
        return new ReadinessResponseDTO(
            s.getScoreId(),
            s.getStudent() != null ? s.getStudent().getStudentId() : null,
            s.getStudent() != null ? s.getStudent().getFullName() : null,
            s.getJobPosting() != null ? s.getJobPosting().getJobId() : null,
            s.getJobPosting() != null ? s.getJobPosting().getJobTitle() : null,
            s.getJobPosting() != null && s.getJobPosting().getCompany() != null
                ? s.getJobPosting().getCompany().getCompanyName() : null,
            s.getSkillMatchScore(),
            s.getGpaWeight(),
            s.getProjectScore(),
            s.getCompanyRiskScore(),
            s.getFinalReadiness(),
            s.getReadinessLevel(),
            s.getMissingSkills(),
            s.getRecommendation(),
            s.getCalculatedAt()
        );
    }

    public Map<String, Object> calculateReadiness(Integer studentId, Integer jobId) {
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        JobPosting job = jobPostingRepository.findById(jobId)
            .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));

        BigDecimal companyRiskScore = riskProfileRepository
            .findByCompanyCompanyId(job.getCompany().getCompanyId())
            .map(CompanyRiskProfile::getRiskIndex)
            .orElse(new BigDecimal("50"));

        List<StudentSkill> studentSkills = studentSkillRepository
            .findByStudentStudentId(studentId);

        Map<String, BigDecimal> studentSkillMap = new HashMap<>();
        for (StudentSkill ss : studentSkills) {
            BigDecimal weight = switch (ss.getProficiencyLevel()) {
                case "expert"       -> new BigDecimal("1.0");
                case "advanced"     -> new BigDecimal("0.85");
                case "intermediate" -> new BigDecimal("0.65");
                case "beginner"     -> new BigDecimal("0.4");
                default             -> BigDecimal.ZERO;
            };
            studentSkillMap.put(ss.getSkill().getSkillName().toLowerCase(), weight);
        }

        String[] requiredSkillsArray = job.getRequiredSkills() != null
            ? job.getRequiredSkills().split(",")
            : new String[]{};

        BigDecimal totalWeight   = BigDecimal.ZERO;
        BigDecimal matchedWeight = BigDecimal.ZERO;
        List<String> missingSkills = new ArrayList<>();

        for (String requiredSkill : requiredSkillsArray) {
            String skillName = requiredSkill.trim().toLowerCase();
            totalWeight = totalWeight.add(BigDecimal.ONE);
            if (studentSkillMap.containsKey(skillName)) {
                matchedWeight = matchedWeight.add(studentSkillMap.get(skillName));
            } else {
                missingSkills.add(requiredSkill.trim());
            }
        }

        BigDecimal skillMatchScore = totalWeight.compareTo(BigDecimal.ZERO) > 0
            ? matchedWeight.divide(totalWeight, 4, RoundingMode.HALF_UP)
                          .multiply(new BigDecimal("100"))
                          .setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        BigDecimal gpaWeight = student.getGpa()
            .divide(new BigDecimal("10.0"), 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"))
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal projectScore = student.getProjectScore()
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal finalReadiness = skillMatchScore.multiply(new BigDecimal("0.5"))
            .add(gpaWeight.multiply(new BigDecimal("0.2")))
            .add(projectScore.multiply(new BigDecimal("0.2")))
            .subtract(companyRiskScore.multiply(new BigDecimal("0.1")))
            .setScale(2, RoundingMode.HALF_UP);

        String readinessLevel;
        if (finalReadiness.compareTo(new BigDecimal("80")) >= 0)      readinessLevel = "excellent";
        else if (finalReadiness.compareTo(new BigDecimal("60")) >= 0) readinessLevel = "good";
        else if (finalReadiness.compareTo(new BigDecimal("40")) >= 0) readinessLevel = "moderate";
        else                                                           readinessLevel = "low";

        String recommendation = switch (readinessLevel) {
            case "excellent" -> "Highly recommended to apply";
            case "good"      -> "Good candidate";
            case "moderate"  -> "Significant gaps exist";
            default          -> "Not ready yet";
        };

        ReadinessScore score = readinessScoreRepository
            .findByStudentStudentIdAndJobPostingJobId(studentId, jobId)
            .orElse(new ReadinessScore());

        score.setStudent(student);
        score.setJobPosting(job);
        score.setSkillMatchScore(skillMatchScore);
        score.setGpaWeight(gpaWeight);
        score.setProjectScore(projectScore);
        score.setCompanyRiskScore(companyRiskScore);
        score.setFinalReadiness(finalReadiness);
        score.setReadinessLevel(readinessLevel);
        score.setMissingSkills(String.join(", ", missingSkills));
        score.setRecommendation(recommendation);
        readinessScoreRepository.save(score);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("studentId", studentId);
        result.put("studentName", student.getFullName());
        result.put("jobId", jobId);
        result.put("jobTitle", job.getJobTitle());
        result.put("companyName", job.getCompany().getCompanyName());
        result.put("finalReadiness", finalReadiness);
        result.put("readinessLevel", readinessLevel);
        result.put("recommendation", recommendation);
        result.put("skillMatchScore", skillMatchScore);
        result.put("gpaWeight", gpaWeight);
        result.put("projectScore", projectScore);
        result.put("companyRiskScore", companyRiskScore);
        result.put("missingSkills", missingSkills);
        result.put("totalRequiredSkills", requiredSkillsArray.length);
        result.put("matchedSkills", requiredSkillsArray.length - missingSkills.size());
        return result;
    }

    public List<Map<String, Object>> calculateReadinessForAllJobs(Integer studentId) {
        List<JobPosting> activeJobs = jobPostingRepository.findByIsActiveTrue();
        List<Map<String, Object>> results = new ArrayList<>();
        for (JobPosting job : activeJobs) {
            try {
                results.add(calculateReadiness(studentId, job.getJobId()));
            } catch (Exception e) {
                // skip jobs that fail
            }
        }
        results.sort((a, b) -> {
            BigDecimal scoreA = (BigDecimal) a.get("finalReadiness");
            BigDecimal scoreB = (BigDecimal) b.get("finalReadiness");
            return scoreB.compareTo(scoreA);
        });
        return results;
    }

    public List<ReadinessResponseDTO> getStudentReadinessHistory(Integer studentId) {
        return readinessScoreRepository.findByStudentOrderByScoreDesc(studentId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<ReadinessResponseDTO> getReadinessByStudentAndJob(
            Integer studentId, Integer jobId) {
        return readinessScoreRepository
            .findByStudentStudentIdAndJobPostingJobId(studentId, jobId)
            .map(this::toDTO);
    }
}