-- Initialize People X database

-- Create schemas
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS forms;

-- Create security tables
CREATE TABLE IF NOT EXISTS security.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  organization_id INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security.roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  organization_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, organization_id)
);

CREATE TABLE IF NOT EXISTS security.permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security.role_permissions (
  role_id INTEGER REFERENCES security.roles(id),
  permission_id INTEGER REFERENCES security.permissions(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS security.user_roles (
  user_id INTEGER REFERENCES security.users(id),
  role_id INTEGER REFERENCES security.roles(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS security.login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES security.users(id),
  login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false
);

-- Create initial roles
INSERT INTO security.roles (name, description) VALUES
('admin', 'System Administrator'),
('hr_admin', 'HR Administrator'),
('manager', 'Department Manager'),
('employee', 'Regular Employee')
ON CONFLICT (name, organization_id) DO NOTHING;

-- Create initial permissions
INSERT INTO security.permissions (code, name, description) VALUES
('view_employees', 'View Employees', 'Can view employee information'),
('edit_employees', 'Edit Employees', 'Can edit employee information'),
('view_departments', 'View Departments', 'Can view department information'),
('edit_departments', 'Edit Departments', 'Can edit department information')
ON CONFLICT (code) DO NOTHING;

-- Create initial admin user
INSERT INTO security.users (
  email, username, password, first_name, last_name, role, status
) VALUES (
  'info@constructx.in',
  'constructx',
  '$2a$10$YourHashedPasswordHere',  -- This will be replaced with actual hashed password
  'Construct',
  'X',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Assign admin role to the initial user
INSERT INTO security.user_roles (
  user_id, role_id
) SELECT 
  u.id, r.id 
FROM 
  security.users u, 
  security.roles r 
WHERE 
  u.email = 'info@constructx.in' 
  AND r.name = 'admin'
ON CONFLICT DO NOTHING; 