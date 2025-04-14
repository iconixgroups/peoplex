-- People X Database Schema
-- Based on the provided specifications

-- Create schemas for logical separation of different functional areas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS recruitment;
CREATE SCHEMA IF NOT EXISTS onboarding;
CREATE SCHEMA IF NOT EXISTS talent;
CREATE SCHEMA IF NOT EXISTS payroll;
CREATE SCHEMA IF NOT EXISTS expense;
CREATE SCHEMA IF NOT EXISTS engagement;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS config;

-- Core Entities: Organization and Structure

CREATE TABLE core.organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    domain VARCHAR(255),
    logo_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE core.departments (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    parent_id INTEGER REFERENCES core.departments(id),
    head_employee_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE core.locations (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE core.job_titles (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users and Authentication

CREATE TABLE auth.users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(512) NOT NULL,
    salt VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth.roles (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

CREATE TABLE auth.permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth.role_permissions (
    role_id INTEGER REFERENCES auth.roles(id),
    permission_id INTEGER REFERENCES auth.permissions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE auth.user_roles (
    user_id INTEGER REFERENCES auth.users(id),
    role_id INTEGER REFERENCES auth.roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Employees

CREATE TABLE hr.employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth.users(id),
    organization_id INTEGER REFERENCES core.organizations(id),
    employee_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    nationality VARCHAR(100),
    tax_id VARCHAR(50),
    social_security_number VARCHAR(50),
    passport_number VARCHAR(50),
    passport_expiry DATE,
    phone_number VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    department_id INTEGER REFERENCES core.departments(id),
    job_title_id INTEGER REFERENCES core.job_titles(id),
    location_id INTEGER REFERENCES core.locations(id),
    manager_id INTEGER REFERENCES hr.employees(id),
    employment_status VARCHAR(50) NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    termination_date DATE,
    termination_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, employee_id)
);

CREATE TABLE hr.employee_documents (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(id),
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    uploaded_by INTEGER REFERENCES auth.users(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES auth.users(id),
    verification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recruitment and Hiring

CREATE TABLE recruitment.job_postings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    title VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES core.departments(id),
    location_id INTEGER REFERENCES core.locations(id),
    job_description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    employment_type VARCHAR(50),
    experience_level VARCHAR(50),
    education_level VARCHAR(100),
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    currency VARCHAR(10),
    is_remote BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL,
    posted_by INTEGER REFERENCES auth.users(id),
    posting_date DATE,
    closing_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recruitment.candidates (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    resume_url VARCHAR(512),
    cover_letter_url VARCHAR(512),
    source VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recruitment.applications (
    id SERIAL PRIMARY KEY,
    job_posting_id INTEGER REFERENCES recruitment.job_postings(id),
    candidate_id INTEGER REFERENCES recruitment.candidates(id),
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    match_percentage INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recruitment.interviews (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES recruitment.applications(id),
    interviewer_id INTEGER REFERENCES hr.employees(id),
    interview_date TIMESTAMP,
    interview_type VARCHAR(50),
    location VARCHAR(255),
    status VARCHAR(50),
    feedback TEXT,
    rating INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding

CREATE TABLE onboarding.onboarding_plans (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id INTEGER REFERENCES core.departments(id),
    job_title_id INTEGER REFERENCES core.job_titles(id),
    duration_days INTEGER,
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE onboarding.onboarding_tasks (
    id SERIAL PRIMARY KEY,
    onboarding_plan_id INTEGER REFERENCES onboarding.onboarding_plans(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    due_day INTEGER,
    assignee_role_id INTEGER REFERENCES auth.roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE onboarding.employee_onboarding (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(id),
    onboarding_plan_id INTEGER REFERENCES onboarding.onboarding_plans(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE onboarding.employee_onboarding_tasks (
    id SERIAL PRIMARY KEY,
    employee_onboarding_id INTEGER REFERENCES onboarding.employee_onboarding(id),
    onboarding_task_id INTEGER REFERENCES onboarding.onboarding_tasks(id),
    assignee_id INTEGER REFERENCES hr.employees(id),
    due_date DATE,
    completion_date DATE,
    status VARCHAR(50) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance and Leave Management

CREATE TABLE hr.attendance_policies (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    work_hours_per_day DECIMAL(5,2),
    work_days_per_week INTEGER,
    flexible_hours BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hr.shifts (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hr.employee_shifts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(id),
    shift_id INTEGER REFERENCES hr.shifts(id),
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hr.attendance_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(id),
    date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    status VARCHAR(50),
    work_hours DECIMAL(5,2),
    location VARCHAR(255),
    ip_address VARCHAR(50),
    device_info TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

CREATE TABLE hr.leave_types (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color_code VARCHAR(7),
    is_paid BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hr.leave_policies (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    leave_type_id INTEGER REFERENCES hr.leave_types(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    days_per_year DECIMAL(5,2) NOT NULL,
    accrual_frequency VARCHAR(20),
    max_carryover_days DECIMAL(5,2),
    min_service_days INTEGER DEFAULT 0,
    applicable_to_roles TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hr.employee_leave_balances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(id),
    leave_type_id INTEGER REFERENCES hr.leave_types(id),
    year INTEGER NOT NULL,
    entitled_days DECIMAL(5,2) NOT NULL,
    carried_over_days DECIMAL(5,2) DEFAULT 0,
    accrued_days DECIMAL(5,2) DEFAULT 0,
    used_days DECIMAL(5,2) DEFAULT 0,
    pending_days DECIMAL(5,2) DEFAULT 0,
    remaining_days DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE hr.leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(id),
    leave_type_id INTEGER REFERENCES hr.leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    half_day BOOLEAN DEFAULT FALSE,
    half_day_part VARCHAR(10),
    days DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL,
    approver_id INTEGER REFERENCES hr.employees(id),
    approval_date TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Management

CREATE TABLE talent.performance_cycles (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE talent.performance_templates (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE talent.performance_criteria (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES talent.performance_templates(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE talent.employee_reviews (
    id SERIAL PRIMARY KEY,
    cycle_id INTEGER REFERENCES talent.performance_cycles(id),
    employee_id INTEGER REFERENCES hr.employees(id),
    reviewer_id INTEGER REFERENCES hr.employees(id),
    template_id INTEGER REFERENCES talent.performance_templates(id),
    status VARCHAR(50) NOT NULL,
    submission_date TIMESTAMP,
    overall_rating DECIMAL(3,2),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE talent.review_ratings (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES talent.employee_reviews(id),
    criteria_id INTEGER REFERENCES talent.performance_criteria(id),
    rating DECIMAL(3,2) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals Management

CREATE TABLE talent.goals (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    due_date DATE,
    status VARCHAR(50) NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    weight DECIMAL(5,2) DEFAULT 1.0,
    actual_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compensation Management

CREATE TABLE talent.salary_structures (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    currency VARCHAR(10) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE talent.salary_grades (
    id SERIAL PRIMARY KEY,
    structure_id INTEGER REFERENCES talent.salary_structures(id),
    name VARCHAR(100) NOT NULL,
    min_salary DECIMAL(12,2) NOT NULL,
    mid_salary DECIMAL(12,2),
    max_salary DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE talent.employee_compensation (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(id),
    salary_grade_id INTEGER REFERENCES talent.salary_grades(id),
    base_salary DECIMAL(12,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE talent.compensation_components (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_taxable BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE talent.employee_compensation_components (
    id SERIAL PRIMARY KEY,
    employee_compensation_id INTEGER REFERENCES talent.employee_compensation(id),
    component_id INTEGER REFERENCES talent.compensation_components(id),
    amount DECIMAL(12,2) NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll

CREATE TABLE payroll.payroll_periods (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payroll.payroll_runs (
    id SERIAL PRIMARY KEY,
    period_id INTEGER REFERENCES payroll.payroll_periods(id),
    run_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    processed_by INTEGER REFERENCES auth.users(id),
    approved_by INTEGER REFERENCES auth.users(id),
    approval_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payroll.employee_payslips (
    id SERIAL PRIMARY KEY,
    payroll_run_id INTEGER REFERENCES payroll.payroll_runs(id),
    employee_id INTEGER REFERENCES hr.employees(id),
    gross_salary DECIMAL(12,2) NOT NULL,
    total_deductions DECIMAL(12,2) NOT NULL,
    net_salary DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payroll.payslip_components (
    id SERIAL PRIMARY KEY,
    payslip_id INTEGER REFERENCES payroll.employee_payslips(id),
    component_name VARCHAR(255) NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    is_taxable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Management

CREATE TABLE expense.expense_categories (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense.expense_policies (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    category_id INTEGER REFERENCES expense.expense_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_amount DECIMAL(12,2),
    currency VARCHAR(10),
    applicable_to_roles TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense.trips (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(id),
    purpose VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    approver_id INTEGER REFERENCES hr.employees(id),
    approval_date TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense.trip_destinations (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES expense.trips(id),
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense.expense_reports (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES hr.employees(id),
    trip_id INTEGER REFERENCES expense.trips(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL,
    submitted_date TIMESTAMP,
    approver_id INTEGER REFERENCES hr.employees(id),
    approval_date TIMESTAMP,
    rejection_reason TEXT,
    reimbursement_date DATE,
    reimbursement_method VARCHAR(50),
    reimbursement_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense.expense_items (
    id SERIAL PRIMARY KEY,
    expense_report_id INTEGER REFERENCES expense.expense_reports(id),
    category_id INTEGER REFERENCES expense.expense_categories(id),
    date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    description TEXT,
    receipt_url VARCHAR(512),
    is_billable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Engagement

CREATE TABLE engagement.survey_templates (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE engagement.survey_questions (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES engagement.survey_templates(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    options TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE engagement.surveys (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    template_id INTEGER REFERENCES engagement.survey_templates(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE engagement.survey_participants (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER REFERENCES engagement.surveys(id),
    employee_id INTEGER REFERENCES hr.employees(id),
    status VARCHAR(50) NOT NULL,
    completion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE engagement.survey_responses (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES engagement.survey_participants(id),
    question_id INTEGER REFERENCES engagement.survey_questions(id),
    response_text TEXT,
    response_option INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE engagement.communication_channels (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    channel_type VARCHAR(50) NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE engagement.channel_members (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES engagement.communication_channels(id),
    employee_id INTEGER REFERENCES hr.employees(id),
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE engagement.channel_messages (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES engagement.communication_channels(id),
    employee_id INTEGER REFERENCES hr.employees(id),
    message_text TEXT NOT NULL,
    attachment_url VARCHAR(512),
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HR Analytics

CREATE TABLE analytics.metric_definitions (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    calculation_method TEXT NOT NULL,
    unit VARCHAR(50),
    target_value DECIMAL(12,2),
    display_order INTEGER,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics.metric_data (
    id SERIAL PRIMARY KEY,
    definition_id INTEGER REFERENCES analytics.metric_definitions(id),
    date DATE NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics.dashboards (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics.dashboard_widgets (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER REFERENCES analytics.dashboards(id),
    title VARCHAR(255) NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    data_source VARCHAR(255) NOT NULL,
    configuration JSONB,
    position_x INTEGER,
    position_y INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics.reports (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query_definition TEXT NOT NULL,
    schedule VARCHAR(50),
    last_run_at TIMESTAMP,
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HR Automation & Custom Services

CREATE TABLE workflow.workflow_definitions (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_configuration JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow.workflow_steps (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflow.workflow_definitions(id),
    step_number INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    step_configuration JSONB,
    next_step_on_success INTEGER,
    next_step_on_failure INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow.workflow_instances (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflow.workflow_definitions(id),
    status VARCHAR(50) NOT NULL,
    context_data JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow.workflow_step_executions (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER REFERENCES workflow.workflow_instances(id),
    step_id INTEGER REFERENCES workflow.workflow_steps(id),
    status VARCHAR(50) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow.custom_forms (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    form_schema JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow.form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES workflow.custom_forms(id),
    submitted_by INTEGER REFERENCES auth.users(id),
    submission_data JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow.custom_applications (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    app_schema JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow.webhooks (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    endpoint_url VARCHAR(512) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    headers JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    secret_key VARCHAR(255),
    created_by INTEGER REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow.webhook_logs (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER REFERENCES workflow.webhooks(id),
    trigger_event VARCHAR(100) NOT NULL,
    request_payload JSONB,
    response_code INTEGER,
    response_body TEXT,
    execution_time INTEGER,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuration and Settings

CREATE TABLE config.system_settings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_group VARCHAR(100),
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, setting_key)
);

CREATE TABLE config.email_templates (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    template_code VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    placeholders TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, template_code)
);

CREATE TABLE config.notification_settings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    event_type VARCHAR(100) NOT NULL,
    notification_channels JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, event_type)
);

-- Audit and Logging

CREATE TABLE core.audit_logs (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES core.organizations(id),
    user_id INTEGER REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
