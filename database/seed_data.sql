-- =============================================
-- LASIS SEED DATA
-- =============================================

-- =============================================
-- DEPARTMENTS (8)
-- =============================================
INSERT INTO departments (dept_name, dept_code) VALUES
('Computer Science and Engineering', 'CSE'),
('Information Technology', 'IT'),
('Electronics and Communication Engineering', 'ECE'),
('Mechanical Engineering', 'ME'),
('Civil Engineering', 'CE'),
('Electrical Engineering', 'EE'),
('Data Science and Artificial Intelligence', 'DSAI'),
('Business Administration', 'MBA');

-- =============================================
-- COMPANIES (10) — Fixed, do not change
-- =============================================
INSERT INTO companies (company_name, sector, company_type, funding_stage, headquarters, website) VALUES
('Google', 'Technology', 'MNC', 'Public', 'Mountain View, CA', 'https://google.com'),
('Microsoft', 'Technology', 'MNC', 'Public', 'Redmond, WA', 'https://microsoft.com'),
('Amazon', 'E-Commerce/Cloud', 'MNC', 'Public', 'Seattle, WA', 'https://amazon.com'),
('Meta', 'Social Media', 'MNC', 'Public', 'Menlo Park, CA', 'https://meta.com'),
('Apple', 'Technology', 'MNC', 'Public', 'Cupertino, CA', 'https://apple.com'),
('Netflix', 'Entertainment/Tech', 'MNC', 'Public', 'Los Gatos, CA', 'https://netflix.com'),
('Goldman Sachs', 'Finance', 'GCC', 'Public', 'New York, NY', 'https://goldmansachs.com'),
('JPMorgan Chase', 'Finance', 'GCC', 'Public', 'New York, NY', 'https://jpmorganchase.com'),
('Adobe', 'Software', 'MNC', 'Public', 'San Jose, CA', 'https://adobe.com'),
('Salesforce', 'CRM/Cloud', 'MNC', 'Public', 'San Francisco, CA', 'https://salesforce.com');

-- =============================================
-- COMPANY RISK PROFILES (10)
-- =============================================
INSERT INTO company_risk_profiles (company_id, layoff_frequency, last_layoff_date, layoff_count_2024, layoff_count_2025, hiring_trend, revenue_growth, automation_impact, stability_score, risk_index, risk_level) VALUES
(1,  1.2, '2024-01-10', 12000, 1000, 'stable',    15.2, 'medium',   71.3, 28.7, 'medium'),
(2,  0.8, '2024-05-15',  5000,  500, 'growing',   17.5, 'medium',   78.9, 21.1, 'medium'),
(3,  3.1, '2024-09-20', 27000, 8000, 'declining',  8.3, 'high',     38.0, 62.0, 'high'),
(4,  2.8, '2024-02-28', 10000, 3600, 'declining', 12.1, 'high',     42.0, 58.0, 'high'),
(5,  0.3, '2023-03-01',  3900,    0, 'stable',    10.2, 'low',      89.9, 10.1, 'low'),
(6,  0.4, '2024-01-23',  2500,    0, 'stable',    12.5, 'low',      88.5, 11.5, 'low'),
(7,  0.2, '2023-06-01',  3200,    0, 'growing',   14.8, 'low',      91.0,  9.0, 'low'),
(8,  0.1, '2022-01-01',   500,    0, 'growing',   16.2, 'low',      96.0,  4.0, 'low'),
(9,  0.5, '2023-12-01',  2800,    0, 'stable',    11.3, 'low',      86.5, 13.5, 'low'),
(10, 3.4, '2025-02-01', 10000, 1000, 'declining',  9.7, 'critical', 32.0, 68.0, 'high');

-- =============================================
-- RISK SIGNALS (real 2024-2025 events)
-- =============================================
INSERT INTO risk_signals (company_id, signal_type, signal_source, headline, severity_score, affected_count, is_verified, signal_date) VALUES
(3,  'LAYOFF_NEWS',       'TechCrunch',    'Amazon cuts 27000 jobs across divisions', 9.2, 27000, TRUE, '2024-01-10'),
(3,  'HIRING_FREEZE',     'Bloomberg',     'Amazon pauses corporate hiring in Q3',    7.5,     0, TRUE, '2024-07-15'),
(3,  'FINANCIAL_WARNING', 'Reuters',       'Amazon AWS revenue growth slows to 8%',   6.0,     0, TRUE, '2024-09-20'),
(4,  'LAYOFF_NEWS',       'The Verge',     'Meta lays off 10000 across Reality Labs', 8.8, 10000, TRUE, '2024-02-28'),
(4,  'LAYOFF_NEWS',       'CNBC',          'Meta cuts 3600 more in performance review',7.0, 3600, TRUE, '2025-02-15'),
(10, 'LAYOFF_NEWS',       'Forbes',        'Salesforce cuts 10000 after Agentforce launch',9.0,10000,TRUE,'2024-01-08'),
(10, 'LAYOFF_NEWS',       'TechCrunch',    'Salesforce second round of layoffs 2025', 8.0,  1000, TRUE, '2025-02-01'),
(10, 'HIRING_FREEZE',     'Bloomberg',     'Salesforce freezes new grad hiring',      7.5,     0, TRUE, '2024-06-01'),
(1,  'LAYOFF_NEWS',       'NYT',           'Google cuts 12000 employees globally',    8.5, 12000, TRUE, '2024-01-10'),
(1,  'POSITIVE_NEWS',     'Google Blog',   'Google announces 2025 hiring expansion',  3.0,     0, TRUE, '2025-01-15'),
(2,  'LAYOFF_NEWS',       'Bloomberg',     'Microsoft lays off 5000 in restructuring',7.0,  5000, TRUE, '2024-05-15'),
(2,  'POSITIVE_NEWS',     'Microsoft Blog','Microsoft Azure revenue grows 29%',       2.0,     0, TRUE, '2025-01-20'),
(5,  'POSITIVE_NEWS',     'Apple Newsroom','Apple reports record Q1 2025 revenue',    1.5,     0, TRUE, '2025-02-01'),
(8,  'POSITIVE_NEWS',     'JPM Press',     'JPMorgan Chase posts record profit 2024', 1.0,     0, TRUE, '2024-12-15');

-- =============================================
-- SKILLS (47)
-- =============================================
INSERT INTO skills (skill_name, category, demand_level) VALUES
-- Programming
('Java',          'Programming', 'critical'),
('Python',        'Programming', 'critical'),
('JavaScript',    'Programming', 'high'),
('TypeScript',    'Programming', 'high'),
('C++',           'Programming', 'high'),
('Go',            'Programming', 'high'),
('Kotlin',        'Programming', 'medium'),
('Swift',         'Programming', 'medium'),
('R',             'Programming', 'medium'),
('Scala',         'Programming', 'medium'),
-- Cloud
('AWS',           'Cloud', 'critical'),
('Azure',         'Cloud', 'critical'),
('Google Cloud',  'Cloud', 'high'),
('Docker',        'Cloud', 'critical'),
('Kubernetes',    'Cloud', 'high'),
-- AI/ML
('Machine Learning',    'AI/ML', 'critical'),
('Deep Learning',       'AI/ML', 'high'),
('NLP',                 'AI/ML', 'high'),
('Computer Vision',     'AI/ML', 'high'),
('TensorFlow',          'AI/ML', 'high'),
('PyTorch',             'AI/ML', 'high'),
('scikit-learn',        'AI/ML', 'high'),
('LLM Fine-tuning',     'AI/ML', 'critical'),
-- Database
('SQL',                 'Database', 'critical'),
('PostgreSQL',          'Database', 'high'),
('MongoDB',             'Database', 'high'),
('Redis',               'Database', 'high'),
('Elasticsearch',       'Database', 'medium'),
-- DevOps
('Git',                 'DevOps', 'critical'),
('CI/CD',               'DevOps', 'high'),
('Jenkins',             'DevOps', 'medium'),
('Terraform',           'DevOps', 'high'),
('Linux',               'DevOps', 'high'),
-- System Design
('System Design',       'System Design', 'critical'),
('Microservices',       'System Design', 'high'),
('REST API Design',     'System Design', 'critical'),
('GraphQL',             'System Design', 'medium'),
('Message Queues',      'System Design', 'high'),
-- Soft Skills
('Communication',       'Soft Skills', 'high'),
('Problem Solving',     'Soft Skills', 'critical'),
('Team Collaboration',  'Soft Skills', 'high'),
('Leadership',          'Soft Skills', 'medium'),
-- Domain
('Spring Boot',         'Domain', 'critical'),
('React',               'Domain', 'high'),
('Node.js',             'Domain', 'high'),
('Data Structures',     'Domain', 'critical'),
('Algorithms',          'Domain', 'critical');

-- =============================================
-- STUDENTS (30)
-- =============================================
INSERT INTO students (full_name, email, phone, department_id, gpa, graduation_year, backlogs, project_score, is_placed) VALUES
('Arjun Sharma',       'arjun.sharma@srmist.edu.in',    '9876543201', 1, 8.7, 2025, 0, 85.0, FALSE),
('Priya Patel',        'priya.patel@srmist.edu.in',     '9876543202', 1, 9.1, 2025, 0, 90.0, FALSE),
('Rahul Verma',        'rahul.verma@srmist.edu.in',     '9876543203', 7, 7.8, 2025, 0, 78.0, FALSE),
('Sneha Gupta',        'sneha.gupta@srmist.edu.in',     '9876543204', 1, 8.2, 2025, 0, 82.0, FALSE),
('Vikram Singh',       'vikram.singh@srmist.edu.in',    '9876543205', 2, 7.5, 2025, 1, 70.0, FALSE),
('Ananya Reddy',       'ananya.reddy@srmist.edu.in',    '9876543206', 7, 9.3, 2025, 0, 92.0, FALSE),
('Karan Mehta',        'karan.mehta@srmist.edu.in',     '9876543207', 1, 6.8, 2025, 2, 65.0, FALSE),
('Pooja Iyer',         'pooja.iyer@srmist.edu.in',      '9876543208', 2, 8.5, 2025, 0, 80.0, FALSE),
('Rohan Das',          'rohan.das@srmist.edu.in',       '9876543209', 3, 7.2, 2025, 1, 68.0, FALSE),
('Divya Nair',         'divya.nair@srmist.edu.in',      '9876543210', 1, 8.9, 2025, 0, 88.0, FALSE),
('Aditya Kumar',       'aditya.kumar@srmist.edu.in',    '9876543211', 1, 9.0, 2025, 0, 91.0, FALSE),
('Kavya Krishnan',     'kavya.krishnan@srmist.edu.in',  '9876543212', 7, 8.4, 2025, 0, 83.0, FALSE),
('Siddharth Joshi',    'siddharth.joshi@srmist.edu.in', '9876543213', 2, 7.6, 2025, 0, 74.0, FALSE),
('Meera Banerjee',     'meera.banerjee@srmist.edu.in',  '9876543214', 1, 8.1, 2025, 0, 79.0, FALSE),
('Nikhil Tiwari',      'nikhil.tiwari@srmist.edu.in',   '9876543215', 1, 7.3, 2025, 1, 71.0, FALSE),
('Ishaan Chopra',      'ishaan.chopra@srmist.edu.in',   '9876543216', 7, 9.2, 2025, 0, 93.0, FALSE),
('Tanvi Desai',        'tanvi.desai@srmist.edu.in',     '9876543217', 2, 8.6, 2025, 0, 84.0, FALSE),
('Yash Malhotra',      'yash.malhotra@srmist.edu.in',   '9876543218', 1, 7.9, 2025, 0, 77.0, FALSE),
('Riya Saxena',        'riya.saxena@srmist.edu.in',     '9876543219', 7, 8.8, 2025, 0, 87.0, FALSE),
('Harsh Agarwal',      'harsh.agarwal@srmist.edu.in',   '9876543220', 1, 6.5, 2025, 3, 60.0, FALSE),
('Simran Kaur',        'simran.kaur@srmist.edu.in',     '9876543221', 2, 8.3, 2025, 0, 81.0, FALSE),
('Varun Pandey',       'varun.pandey@srmist.edu.in',    '9876543222', 1, 7.7, 2025, 0, 75.0, FALSE),
('Nisha Rao',          'nisha.rao@srmist.edu.in',       '9876543223', 7, 9.0, 2025, 0, 89.0, FALSE),
('Abhishek Mishra',    'abhishek.mishra@srmist.edu.in', '9876543224', 1, 8.0, 2025, 0, 78.0, FALSE),
('Pallavi Shukla',     'pallavi.shukla@srmist.edu.in',  '9876543225', 2, 7.4, 2025, 1, 69.0, FALSE),
('Dhruv Chauhan',      'dhruv.chauhan@srmist.edu.in',   '9876543226', 1, 8.5, 2025, 0, 83.0, FALSE),
('Ankita Bhatt',       'ankita.bhatt@srmist.edu.in',    '9876543227', 7, 9.1, 2025, 0, 90.0, FALSE),
('Sameer Yadav',       'sameer.yadav@srmist.edu.in',    '9876543228', 1, 7.1, 2025, 2, 66.0, FALSE),
('Kritika Jain',       'kritika.jain@srmist.edu.in',    '9876543229', 2, 8.7, 2025, 0, 86.0, FALSE),
('Mohit Sinha',        'mohit.sinha@srmist.edu.in',     '9876543230', 1, 7.6, 2025, 0, 73.0, FALSE);

-- =============================================
-- STUDENT SKILLS (sample for first 5 students)
-- =============================================
-- Arjun Sharma (student_id=1) — strong Java/backend
INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES
(1, 1,  'expert'),      -- Java
(1, 24, 'advanced'),    -- SQL
(1, 44, 'advanced'),    -- Spring Boot
(1, 29, 'intermediate'),-- Git
(1, 36, 'intermediate'),-- REST API Design
(1, 40, 'advanced'),    -- Problem Solving
(1, 46, 'expert'),      -- Data Structures
(1, 47, 'advanced');    -- Algorithms

-- Priya Patel (student_id=2) — full stack
INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES
(2, 1,  'advanced'),    -- Java
(2, 2,  'advanced'),    -- Python
(2, 3,  'intermediate'),-- JavaScript
(2, 45, 'intermediate'),-- React
(2, 24, 'advanced'),    -- SQL
(2, 44, 'advanced'),    -- Spring Boot
(2, 14, 'intermediate'),-- Docker
(2, 29, 'advanced'),    -- Git
(2, 46, 'expert'),      -- Data Structures
(2, 47, 'expert');      -- Algorithms

-- Rahul Verma (student_id=3) — ML focused
INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES
(3, 2,  'expert'),      -- Python
(3, 16, 'advanced'),    -- Machine Learning
(3, 22, 'intermediate'),-- scikit-learn
(3, 20, 'intermediate'),-- TensorFlow
(3, 24, 'intermediate'),-- SQL
(3, 29, 'intermediate'),-- Git
(3, 46, 'advanced'),    -- Data Structures
(3, 47, 'advanced');    -- Algorithms

-- Sneha Gupta (student_id=4) — cloud/devops
INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES
(4, 1,  'intermediate'),-- Java
(4, 11, 'advanced'),    -- AWS
(4, 14, 'advanced'),    -- Docker
(4, 15, 'intermediate'),-- Kubernetes
(4, 30, 'intermediate'),-- CI/CD
(4, 32, 'intermediate'),-- Terraform
(4, 33, 'advanced'),    -- Linux
(4, 24, 'intermediate'),-- SQL
(4, 29, 'advanced');    -- Git

-- Vikram Singh (student_id=5) — average profile
INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES
(5, 1,  'intermediate'),-- Java
(5, 24, 'beginner'),    -- SQL
(5, 29, 'intermediate'),-- Git
(5, 3,  'beginner'),    -- JavaScript
(5, 46, 'intermediate');-- Data Structures

-- =============================================
-- JOB POSTINGS (10)
-- =============================================
INSERT INTO job_postings (company_id, job_title, job_description, required_skills, salary_min, salary_max, required_gpa, max_backlogs, openings, application_deadline) VALUES
(1,  'Software Engineer',
     'Build and scale Google products used by billions',
     'Java,Python,Data Structures,Algorithms,System Design,SQL',
     2500000, 4500000, 7.5, 0, 50, '2025-06-30'),

(2,  'Software Development Engineer',
     'Develop cloud-first solutions on Azure platform',
     'Java,C++,Data Structures,Algorithms,Azure,System Design',
     2200000, 4000000, 7.0, 0, 40, '2025-06-30'),

(3,  'SDE-1',
     'Build highly scalable services for Amazon customers',
     'Java,Data Structures,Algorithms,SQL,System Design,REST API Design',
     1800000, 3500000, 7.0, 0, 60, '2025-05-31'),

(4,  'Software Engineer - AI',
     'Work on Meta AI and Reality Labs projects',
     'Python,Machine Learning,Deep Learning,PyTorch,Data Structures,Algorithms',
     2800000, 5000000, 8.0, 0, 30, '2025-06-15'),

(5,  'iOS Developer',
     'Build next generation iOS applications',
     'Swift,Kotlin,Data Structures,Algorithms,REST API Design',
     2000000, 3800000, 7.5, 0, 25, '2025-07-15'),

(6,  'Backend Engineer',
     'Build Netflix streaming platform infrastructure',
     'Java,Python,AWS,Docker,Kubernetes,System Design,Microservices',
     2300000, 4200000, 7.5, 0, 20, '2025-06-30'),

(7,  'Technology Analyst',
     'Build financial technology systems at Goldman Sachs',
     'Java,Python,SQL,Data Structures,Algorithms,Problem Solving',
     1800000, 3200000, 7.0, 0, 35, '2025-05-15'),

(8,  'Software Engineer - GCC',
     'Develop banking and financial systems',
     'Java,SQL,Spring Boot,REST API Design,Data Structures,Git',
     1600000, 2800000, 6.5, 1, 45, '2025-05-31'),

(9,  'Frontend Developer',
     'Build creative tools used by designers worldwide',
     'JavaScript,TypeScript,React,REST API Design,Git,Problem Solving',
     1800000, 3200000, 7.0, 0, 30, '2025-06-15'),

(10, 'Salesforce Developer',
     'Build CRM solutions on Salesforce platform',
     'Java,SQL,REST API Design,Spring Boot,Git,Problem Solving',
     1500000, 2600000, 6.5, 1, 40, '2025-05-31');