-- =============================================
-- LASIS DATABASE SCHEMA
-- Database: lasis_db
-- =============================================

-- TABLE 1: departments
CREATE TABLE IF NOT EXISTS departments (
  department_id  SERIAL PRIMARY KEY,
  dept_name      VARCHAR(100) NOT NULL UNIQUE
  dept_code      VARCHAR(10)  NOT NULL UNIQUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 2: students
CREATE TABLE IF NOT EXISTS students (
  student_id      SERIAL PRIMARY KEY,
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  phone           VARCHAR(15)  UNIQUE,
  department_id   INT NOT NULL REFERENCES departments(department_id),
  gpa             DECIMAL(3,2) NOT NULL CHECK (gpa BETWEEN 0 AND 10),
  graduation_year INT NOT NULL,
  backlogs        INT DEFAULT 0,
  resume_url      TEXT,
  project_score   DECIMAL(5,2) DEFAULT 0,
  is_placed       BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 3: companies
CREATE TABLE IF NOT EXISTS companies (
  company_id          SERIAL PRIMARY KEY,
  company_name        VARCHAR(150) NOT NULL UNIQUE,
  sector              VARCHAR(100) NOT NULL,
  company_type        VARCHAR(50)  NOT NULL
                      CHECK (company_type IN ('MNC','GCC','Startup','PSU','SME')),
  funding_stage       VARCHAR(50),
  headquarters        VARCHAR(100),
  website             VARCHAR(200),
  is_active_recruiter BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 4: company_risk_profiles
CREATE TABLE IF NOT EXISTS company_risk_profiles (
  risk_profile_id    SERIAL PRIMARY KEY,
  company_id         INT NOT NULL UNIQUE REFERENCES companies(company_id),
  layoff_frequency   DECIMAL(5,2) DEFAULT 0,
  last_layoff_date   DATE,
  layoff_count_2024  INT DEFAULT 0,
  layoff_count_2025  INT DEFAULT 0,
  hiring_trend       VARCHAR(20) DEFAULT 'stable'
                     CHECK (hiring_trend IN ('growing','stable','declining','frozen')),
  revenue_growth     DECIMAL(6,2) DEFAULT 0,
  automation_impact  VARCHAR(20) DEFAULT 'medium'
                     CHECK (automation_impact IN ('low','medium','high','critical')),
  stability_score    DECIMAL(5,2) DEFAULT 50,
  risk_index         DECIMAL(5,2) DEFAULT 50,
  risk_level         VARCHAR(20) DEFAULT 'medium'
                     CHECK (risk_level IN ('low','medium','high','critical')),
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 5: risk_signals
CREATE TABLE IF NOT EXISTS risk_signals (
  signal_id      SERIAL PRIMARY KEY,
  company_id     INT NOT NULL REFERENCES companies(company_id),
  signal_type    VARCHAR(50) NOT NULL
                 CHECK (signal_type IN (
                 'LAYOFF_NEWS','SEC_FILING','FINANCIAL_WARNING',
                 'HIRING_FREEZE','FUNDING_CUT','ACQUISITION','POSITIVE_NEWS')),
  signal_source  VARCHAR(100),
  headline       TEXT NOT NULL,
  severity_score DECIMAL(4,2) NOT NULL CHECK (severity_score BETWEEN 0 AND 10),
  affected_count INT DEFAULT 0,
  is_verified    BOOLEAN DEFAULT FALSE,
  signal_date    DATE NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 6: skills
CREATE TABLE IF NOT EXISTS skills (
  skill_id     SERIAL PRIMARY KEY,
  skill_name   VARCHAR(100) NOT NULL UNIQUE,
  category     VARCHAR(50)  NOT NULL
               CHECK (category IN (
               'Programming','Cloud','AI/ML','Database',
               'DevOps','System Design','Soft Skills','Domain')),
  demand_level VARCHAR(20) DEFAULT 'medium'
               CHECK (demand_level IN ('low','medium','high','critical')),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 7: student_skills
CREATE TABLE IF NOT EXISTS student_skills (
  student_skill_id  SERIAL PRIMARY KEY,
  student_id        INT NOT NULL REFERENCES students(student_id),
  skill_id          INT NOT NULL REFERENCES skills(skill_id),
  proficiency_level VARCHAR(20) NOT NULL
                    CHECK (proficiency_level IN
                    ('beginner','intermediate','advanced','expert')),
  verified          BOOLEAN DEFAULT FALSE,
  added_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, skill_id)
);

-- TABLE 8: job_postings
CREATE TABLE IF NOT EXISTS job_postings (
  job_id               SERIAL PRIMARY KEY,
  company_id           INT NOT NULL REFERENCES companies(company_id),
  job_title            VARCHAR(150) NOT NULL,
  job_description      TEXT,
  required_skills      TEXT NOT NULL,
  salary_min           DECIMAL(10,2),
  salary_max           DECIMAL(10,2),
  required_gpa         DECIMAL(3,2) DEFAULT 6.0,
  max_backlogs         INT DEFAULT 0,
  job_type             VARCHAR(50) DEFAULT 'Full-Time',
  experience_required  VARCHAR(50) DEFAULT 'Fresher',
  openings             INT DEFAULT 1,
  application_deadline DATE,
  is_active            BOOLEAN DEFAULT TRUE,
  posted_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 9: applications
CREATE TABLE IF NOT EXISTS applications (
  application_id SERIAL PRIMARY KEY,
  student_id     INT NOT NULL REFERENCES students(student_id),
  job_id         INT NOT NULL REFERENCES job_postings(job_id),
  status         VARCHAR(50) DEFAULT 'applied'
                 CHECK (status IN (
                 'applied','shortlisted','interview_scheduled',
                 'selected','rejected','offer_revoked','withdrawn')),
  applied_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes          TEXT,
  UNIQUE(student_id, job_id)
);

-- TABLE 10: readiness_scores
CREATE TABLE IF NOT EXISTS readiness_scores (
  score_id           SERIAL PRIMARY KEY,
  student_id         INT NOT NULL REFERENCES students(student_id),
  job_id             INT NOT NULL REFERENCES job_postings(job_id),
  skill_match_score  DECIMAL(5,2) DEFAULT 0,
  gpa_weight         DECIMAL(5,2) DEFAULT 0,
  project_score      DECIMAL(5,2) DEFAULT 0,
  company_risk_score DECIMAL(5,2) DEFAULT 0,
  gap_score          DECIMAL(5,2) DEFAULT 0,
  final_readiness    DECIMAL(5,2) DEFAULT 0,
  readiness_level    VARCHAR(20)  DEFAULT 'low',
  missing_skills     TEXT,
  recommendation     TEXT,
  calculated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, job_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_gpa ON students(gpa);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_risk_signals_company ON risk_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_readiness_student ON readiness_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company_id);

-- =============================================
-- TRIGGER 1: Auto update students.updated_at
-- =============================================
CREATE OR REPLACE FUNCTION fn_update_student_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_student_updated_at
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION fn_update_student_timestamp();

-- =============================================
-- TRIGGER 2: Auto set readiness_level
-- =============================================
CREATE OR REPLACE FUNCTION fn_set_readiness_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.final_readiness >= 80 THEN
    NEW.readiness_level := 'excellent';
  ELSIF NEW.final_readiness >= 60 THEN
    NEW.readiness_level := 'good';
  ELSIF NEW.final_readiness >= 40 THEN
    NEW.readiness_level := 'moderate';
  ELSE
    NEW.readiness_level := 'low';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_readiness_level
BEFORE INSERT OR UPDATE ON readiness_scores
FOR EACH ROW EXECUTE FUNCTION fn_set_readiness_level();

-- =============================================
-- TRIGGER 3: Auto recalculate risk on new signal
-- =============================================
CREATE OR REPLACE FUNCTION fn_recalculate_risk_on_signal()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_layoff_risk(NEW.company_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_risk_on_signal
AFTER INSERT ON risk_signals
FOR EACH ROW EXECUTE FUNCTION fn_recalculate_risk_on_signal();

-- =============================================
-- STORED PROCEDURE 1: calculate_layoff_risk
-- =============================================
CREATE OR REPLACE FUNCTION calculate_layoff_risk(p_company_id INT)
RETURNS TABLE (
  company_name     TEXT,
  risk_index       DECIMAL,
  risk_level       TEXT,
  stability_score  DECIMAL,
  total_signals    BIGINT,
  recommendation   TEXT
) AS $$
DECLARE
  v_comp_name        VARCHAR(150);
  v_layoff_freq      DECIMAL(5,2);
  v_hiring_trend     VARCHAR(20);
  v_automation       VARCHAR(20);
  v_hiring_score     DECIMAL(5,2);
  v_automation_score DECIMAL(5,2);
  v_risk_idx         DECIMAL(5,2);
  v_stability        DECIMAL(5,2);
  v_risk_lvl         VARCHAR(20);
  v_total_signals    BIGINT;
  v_recommendation   TEXT;
BEGIN
  -- Get company name
  SELECT c.company_name INTO v_comp_name
  FROM companies c WHERE c.company_id = p_company_id;

  -- Get risk profile data
  SELECT crp.layoff_frequency, crp.hiring_trend, crp.automation_impact
  INTO v_layoff_freq, v_hiring_trend, v_automation
  FROM company_risk_profiles crp
  WHERE crp.company_id = p_company_id;

  -- hiring score
  v_hiring_score := CASE v_hiring_trend
    WHEN 'growing'   THEN 0
    WHEN 'stable'    THEN 25
    WHEN 'declining' THEN 75
    WHEN 'frozen'    THEN 100
    ELSE 25
  END;

  -- automation score
  v_automation_score := CASE v_automation
    WHEN 'low'      THEN 0
    WHEN 'medium'   THEN 33
    WHEN 'high'     THEN 66
    WHEN 'critical' THEN 100
    ELSE 33
  END;

  -- risk index formula
  v_risk_idx := (0.4 * v_layoff_freq * 10)
              + (0.3 * v_hiring_score)
              + (0.3 * v_automation_score);

  -- stability score
  v_stability := 100 - v_risk_idx;

  -- risk level
  v_risk_lvl := CASE
    WHEN v_risk_idx >= 70 THEN 'critical'
    WHEN v_risk_idx >= 50 THEN 'high'
    WHEN v_risk_idx >= 25 THEN 'medium'
    ELSE 'low'
  END;

  -- count signals
  SELECT COUNT(*) INTO v_total_signals
  FROM risk_signals rs
  WHERE rs.company_id = p_company_id;

  -- recommendation
  v_recommendation := CASE
    WHEN v_risk_idx >= 70 THEN 'Very high risk. Strongly advise against applying.'
    WHEN v_risk_idx >= 50 THEN 'High risk. Apply with caution.'
    WHEN v_risk_idx >= 25 THEN 'Moderate risk. Research before applying.'
    ELSE 'Low risk. Safe to apply.'
  END;

  -- update risk profile
  UPDATE company_risk_profiles
  SET risk_index        = v_risk_idx,
      risk_level        = v_risk_lvl,
      stability_score   = v_stability,
      last_calculated_at = CURRENT_TIMESTAMP
  WHERE company_risk_profiles.company_id = p_company_id;

  RETURN QUERY SELECT
    v_comp_name::TEXT,
    v_risk_idx,
    v_risk_lvl::TEXT,
    v_stability,
    v_total_signals,
    v_recommendation;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STORED PROCEDURE 2: calculate_readiness
-- =============================================
CREATE OR REPLACE FUNCTION calculate_readiness(p_student_id INT, p_job_id INT)
RETURNS TABLE (
  final_score        DECIMAL,
  skill_match        DECIMAL,
  gpa_component      DECIMAL,
  project_component  DECIMAL,
  risk_penalty       DECIMAL,
  missing_skills     TEXT,
  recommendation     TEXT
) AS $$
DECLARE
  v_gpa              DECIMAL(3,2);
  v_project_score    DECIMAL(5,2);
  v_required_skills  TEXT;
  v_company_id       INT;
  v_risk_index       DECIMAL(5,2);
  v_skill_match      DECIMAL(5,2) := 0;
  v_gpa_weight       DECIMAL(5,2);
  v_project_weight   DECIMAL(5,2);
  v_final            DECIMAL(5,2);
  v_missing          TEXT := '';
  v_recommendation   TEXT;
  v_skill            TEXT;
  v_matched_weight   DECIMAL(5,2) := 0;
  v_total_weight     DECIMAL(5,2) := 0;
  v_proficiency      VARCHAR(20);
  v_prof_weight      DECIMAL(5,2);
BEGIN
  -- Get student data
  SELECT s.gpa, s.project_score
  INTO v_gpa, v_project_score
  FROM students s WHERE s.student_id = p_student_id;

  -- Get job data
  SELECT jp.required_skills, jp.company_id
  INTO v_required_skills, v_company_id
  FROM job_postings jp WHERE jp.job_id = p_job_id;

  -- Get company risk index
  SELECT crp.risk_index INTO v_risk_index
  FROM company_risk_profiles crp
  WHERE crp.company_id = v_company_id;

  -- Calculate skill match
  FOR v_skill IN
    SELECT TRIM(unnest(string_to_array(v_required_skills, ',')))
  LOOP
    v_total_weight := v_total_weight + 1;

    SELECT ss.proficiency_level INTO v_proficiency
    FROM student_skills ss
    JOIN skills sk ON sk.skill_id = ss.skill_id
    WHERE ss.student_id = p_student_id
      AND LOWER(sk.skill_name) = LOWER(v_skill);

    IF v_proficiency IS NOT NULL THEN
      v_prof_weight := CASE v_proficiency
        WHEN 'expert'       THEN 1.0
        WHEN 'advanced'     THEN 0.85
        WHEN 'intermediate' THEN 0.65
        WHEN 'beginner'     THEN 0.4
        ELSE 0
      END;
      v_matched_weight := v_matched_weight + v_prof_weight;
    ELSE
      IF v_missing = '' THEN
        v_missing := v_skill;
      ELSE
        v_missing := v_missing || ', ' || v_skill;
      END IF;
    END IF;
    v_proficiency := NULL;
  END LOOP;

  -- skill match score
  IF v_total_weight > 0 THEN
    v_skill_match := (v_matched_weight / v_total_weight) * 100;
  END IF;

  -- component scores
  v_gpa_weight     := (v_gpa / 10.0) * 100;
  v_project_weight := v_project_score;

  -- final readiness formula
  v_final := (0.5 * v_skill_match)
           + (0.2 * v_gpa_weight)
           + (0.2 * v_project_weight)
           - (0.1 * COALESCE(v_risk_index, 50));

  -- recommendation
  v_recommendation := CASE
    WHEN v_final >= 80 THEN 'Highly recommended to apply'
    WHEN v_final >= 60 THEN 'Good candidate'
    WHEN v_final >= 40 THEN 'Significant gaps exist'
    ELSE 'Not ready yet'
  END;

  -- upsert readiness score
  INSERT INTO readiness_scores (
    student_id, job_id, skill_match_score,
    gpa_weight, project_score, company_risk_score,
    final_readiness, missing_skills, recommendation
  ) VALUES (
    p_student_id, p_job_id, v_skill_match,
    v_gpa_weight, v_project_weight, COALESCE(v_risk_index, 50),
    v_final, v_missing, v_recommendation
  )
  ON CONFLICT (student_id, job_id) DO UPDATE
  SET skill_match_score  = EXCLUDED.skill_match_score,
      gpa_weight         = EXCLUDED.gpa_weight,
      project_score      = EXCLUDED.project_score,
      company_risk_score = EXCLUDED.company_risk_score,
      final_readiness    = EXCLUDED.final_readiness,
      missing_skills     = EXCLUDED.missing_skills,
      recommendation     = EXCLUDED.recommendation,
      calculated_at      = CURRENT_TIMESTAMP;

  RETURN QUERY SELECT
    v_final,
    v_skill_match,
    v_gpa_weight,
    v_project_weight,
    COALESCE(v_risk_index, 50),
    v_missing,
    v_recommendation;
END;
$$ LANGUAGE plpgsql;