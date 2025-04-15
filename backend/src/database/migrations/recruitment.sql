-- Create schema for recruitment module
CREATE SCHEMA IF NOT EXISTS hr;

-- Job Requisitions table
CREATE TABLE IF NOT EXISTS hr.requisitions (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES core.organizations(id),
    department_id INTEGER NOT NULL REFERENCES core.departments(id),
    job_title_id INTEGER NOT NULL REFERENCES core.job_titles(id),
    manager_id INTEGER NOT NULL REFERENCES hr.employees(id),
    position_count INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    salary_range_min DECIMAL(10,2),
    salary_range_max DECIMAL(10,2),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES hr.employees(id),
    updated_by INTEGER REFERENCES hr.employees(id)
);

-- Candidates table
CREATE TABLE IF NOT EXISTS hr.candidates (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES core.organizations(id),
    requisition_id INTEGER NOT NULL REFERENCES hr.requisitions(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    resume_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES hr.employees(id),
    updated_by INTEGER REFERENCES hr.employees(id)
);

-- Interviews table
CREATE TABLE IF NOT EXISTS hr.interviews (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES core.organizations(id),
    candidate_id INTEGER NOT NULL REFERENCES hr.candidates(id),
    interviewer_id INTEGER NOT NULL REFERENCES hr.employees(id),
    interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
    interview_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES hr.employees(id),
    updated_by INTEGER REFERENCES hr.employees(id)
);

-- Job Offers table
CREATE TABLE IF NOT EXISTS hr.offers (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES core.organizations(id),
    candidate_id INTEGER NOT NULL REFERENCES hr.candidates(id),
    salary DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES hr.employees(id),
    updated_by INTEGER REFERENCES hr.employees(id)
);

-- Onboarding Plans table
CREATE TABLE IF NOT EXISTS hr.onboarding_plans (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES core.organizations(id),
    candidate_id INTEGER NOT NULL REFERENCES hr.candidates(id),
    start_date DATE NOT NULL,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES hr.employees(id),
    updated_by INTEGER REFERENCES hr.employees(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_requisitions_org_id ON hr.requisitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_dept_id ON hr.requisitions(department_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON hr.requisitions(status);

CREATE INDEX IF NOT EXISTS idx_candidates_org_id ON hr.candidates(organization_id);
CREATE INDEX IF NOT EXISTS idx_candidates_req_id ON hr.candidates(requisition_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON hr.candidates(status);

CREATE INDEX IF NOT EXISTS idx_interviews_org_id ON hr.interviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON hr.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON hr.interviews(status);

CREATE INDEX IF NOT EXISTS idx_offers_org_id ON hr.offers(organization_id);
CREATE INDEX IF NOT EXISTS idx_offers_candidate_id ON hr.offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON hr.offers(status);

CREATE INDEX IF NOT EXISTS idx_onboarding_org_id ON hr.onboarding_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_candidate_id ON hr.onboarding_plans(candidate_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON hr.onboarding_plans(status);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_requisitions_updated_at
    BEFORE UPDATE ON hr.requisitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON hr.candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON hr.interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON hr.offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_plans_updated_at
    BEFORE UPDATE ON hr.onboarding_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 