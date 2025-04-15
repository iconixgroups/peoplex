# People X API Documentation

## Overview

The People X API provides programmatic access to the People X HR management system. This RESTful API allows developers to integrate People X with other systems, extend its functionality, and build custom applications on top of the platform.

## Base URL

All API requests should be made to the following base URL:

```
https://api.peoplex.com/v1
```

For on-premises installations, replace `api.peoplex.com` with your server's domain or IP address.

## Authentication

### API Keys

People X uses API keys for authentication. To obtain an API key:

1. Log in to People X as an administrator
2. Navigate to Settings > API Keys
3. Click "Create New API Key"
4. Provide a name and description for the key
5. Select the appropriate permissions
6. Click "Generate Key"

You will receive an API key and secret. Store these securely as the secret will only be shown once.

### Authentication Headers

Include the following headers with all API requests:

```
X-API-Key: your_api_key
X-API-Secret: your_api_secret
```

### JWT Authentication (Alternative)

For user-context operations, you can also use JWT authentication:

1. Obtain a JWT token by authenticating with username and password:

```
POST /auth/login
{
  "username": "user@example.com",
  "password": "your_password"
}
```

2. Include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## Rate Limiting

API requests are rate-limited to ensure system stability. The current limits are:

- 100 requests per minute per API key
- 1000 requests per hour per API key

Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1619123456
```

## Response Format

All API responses are returned in JSON format. A typical response structure:

```json
{
  "status": "success",
  "data": {
    // Response data here
  },
  "meta": {
    "pagination": {
      "total": 100,
      "count": 10,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 10,
      "links": {
        "next": "https://api.peoplex.com/v1/employees?page=2"
      }
    }
  }
}
```

Error responses follow this structure:

```json
{
  "status": "error",
  "error": {
    "code": "invalid_request",
    "message": "The request was invalid",
    "details": [
      "Field 'email' must be a valid email address"
    ]
  }
}
```

## Common Parameters

### Pagination

Most endpoints that return collections support pagination:

- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 10, max: 100)

Example:
```
GET /employees?page=2&per_page=20
```

### Filtering

Filter results using query parameters:

```
GET /employees?department_id=123&status=active
```

### Sorting

Sort results using the `sort` parameter:

```
GET /employees?sort=last_name
GET /employees?sort=-hire_date (descending order)
```

### Field Selection

Select specific fields to include in the response:

```
GET /employees?fields=id,first_name,last_name,email
```

## API Endpoints

### Authentication

#### Login

```
POST /auth/login
```

Request body:
```json
{
  "username": "user@example.com",
  "password": "your_password"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2023-04-30T12:00:00Z",
    "user": {
      "id": "usr_123456",
      "username": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_admin": false
    }
  }
}
```

#### Logout

```
POST /auth/logout
```

Response:
```json
{
  "status": "success",
  "data": {
    "message": "Successfully logged out"
  }
}
```

#### Refresh Token

```
POST /auth/refresh
```

Request body:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2023-04-30T12:00:00Z"
  }
}
```

### Organizations

#### List Organizations (Multi-tenant only)

```
GET /organizations
```

Response:
```json
{
  "status": "success",
  "data": {
    "organizations": [
      {
        "id": "org_123456",
        "name": "Acme Inc.",
        "domain": "acme.peoplex.com",
        "is_active": true,
        "created_at": "2023-01-15T10:00:00Z"
      },
      {
        "id": "org_789012",
        "name": "XYZ Corporation",
        "domain": "xyz.peoplex.com",
        "is_active": true,
        "created_at": "2023-02-20T14:30:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 2,
      "count": 2,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 1
    }
  }
}
```

#### Get Organization

```
GET /organizations/{organization_id}
```

Response:
```json
{
  "status": "success",
  "data": {
    "organization": {
      "id": "org_123456",
      "name": "Acme Inc.",
      "domain": "acme.peoplex.com",
      "logo_url": "https://assets.peoplex.com/logos/acme.png",
      "primary_contact": {
        "name": "John Smith",
        "email": "john.smith@acme.com",
        "phone": "+1-555-123-4567"
      },
      "address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94105",
        "country": "USA"
      },
      "settings": {
        "timezone": "America/Los_Angeles",
        "date_format": "MM/DD/YYYY",
        "fiscal_year_start": "01-01"
      },
      "subscription": {
        "plan": "enterprise",
        "status": "active",
        "expires_at": "2024-01-15T00:00:00Z"
      },
      "is_active": true,
      "created_at": "2023-01-15T10:00:00Z",
      "updated_at": "2023-03-10T15:45:00Z"
    }
  }
}
```

#### Create Organization (Multi-tenant only)

```
POST /organizations
```

Request body:
```json
{
  "name": "New Company",
  "domain": "newcompany.peoplex.com",
  "logo_url": "https://assets.peoplex.com/logos/newcompany.png",
  "primary_contact": {
    "name": "Jane Doe",
    "email": "jane.doe@newcompany.com",
    "phone": "+1-555-987-6543"
  },
  "address": {
    "street": "456 Market St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "USA"
  },
  "settings": {
    "timezone": "America/New_York",
    "date_format": "MM/DD/YYYY",
    "fiscal_year_start": "01-01"
  },
  "subscription": {
    "plan": "professional",
    "expires_at": "2024-04-15T00:00:00Z"
  }
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "organization": {
      "id": "org_345678",
      "name": "New Company",
      "domain": "newcompany.peoplex.com",
      "is_active": true,
      "created_at": "2023-04-15T09:30:00Z"
    }
  }
}
```

#### Update Organization

```
PUT /organizations/{organization_id}
```

Request body:
```json
{
  "name": "Updated Company Name",
  "logo_url": "https://assets.peoplex.com/logos/updated.png",
  "settings": {
    "timezone": "Europe/London"
  }
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "organization": {
      "id": "org_123456",
      "name": "Updated Company Name",
      "domain": "acme.peoplex.com",
      "logo_url": "https://assets.peoplex.com/logos/updated.png",
      "settings": {
        "timezone": "Europe/London",
        "date_format": "MM/DD/YYYY",
        "fiscal_year_start": "01-01"
      },
      "is_active": true,
      "updated_at": "2023-04-15T10:15:00Z"
    }
  }
}
```

### Employees

#### List Employees

```
GET /employees
```

Response:
```json
{
  "status": "success",
  "data": {
    "employees": [
      {
        "id": "emp_123456",
        "employee_id": "EMP001",
        "first_name": "John",
        "last_name": "Smith",
        "email": "john.smith@example.com",
        "phone": "+1-555-123-4567",
        "hire_date": "2022-01-15",
        "department": {
          "id": "dept_123",
          "name": "Engineering"
        },
        "job_title": {
          "id": "job_456",
          "title": "Senior Developer"
        },
        "location": {
          "id": "loc_789",
          "name": "Headquarters"
        },
        "manager": {
          "id": "emp_789012",
          "name": "Jane Doe"
        },
        "status": "active"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 150,
      "count": 10,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 15,
      "links": {
        "next": "https://api.peoplex.com/v1/employees?page=2"
      }
    }
  }
}
```

#### Get Employee

```
GET /employees/{employee_id}
```

Response:
```json
{
  "status": "success",
  "data": {
    "employee": {
      "id": "emp_123456",
      "employee_id": "EMP001",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john.smith@example.com",
      "phone": "+1-555-123-4567",
      "date_of_birth": "1985-06-15",
      "gender": "male",
      "marital_status": "married",
      "nationality": "US",
      "address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94105",
        "country": "USA"
      },
      "emergency_contact": {
        "name": "Mary Smith",
        "relationship": "Spouse",
        "phone": "+1-555-987-6543"
      },
      "employment": {
        "hire_date": "2022-01-15",
        "employment_type": "full_time",
        "department": {
          "id": "dept_123",
          "name": "Engineering"
        },
        "job_title": {
          "id": "job_456",
          "title": "Senior Developer"
        },
        "location": {
          "id": "loc_789",
          "name": "Headquarters"
        },
        "manager": {
          "id": "emp_789012",
          "name": "Jane Doe"
        }
      },
      "compensation": {
        "salary": 120000,
        "currency": "USD",
        "pay_frequency": "monthly",
        "effective_date": "2023-01-01"
      },
      "documents": [
        {
          "id": "doc_123",
          "name": "Employment Contract",
          "type": "contract",
          "url": "https://api.peoplex.com/v1/documents/doc_123",
          "uploaded_at": "2022-01-10T09:00:00Z"
        }
      ],
      "status": "active",
      "created_at": "2022-01-10T09:00:00Z",
      "updated_at": "2023-01-01T10:30:00Z"
    }
  }
}
```

#### Create Employee

```
POST /employees
```

Request body:
```json
{
  "employee_id": "EMP005",
  "first_name": "Robert",
  "last_name": "Johnson",
  "email": "robert.johnson@example.com",
  "phone": "+1-555-234-5678",
  "date_of_birth": "1990-03-25",
  "gender": "male",
  "marital_status": "single",
  "nationality": "US",
  "address": {
    "street": "456 Oak St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94108",
    "country": "USA"
  },
  "emergency_contact": {
    "name": "Susan Johnson",
    "relationship": "Mother",
    "phone": "+1-555-876-5432"
  },
  "employment": {
    "hire_date": "2023-04-01",
    "employment_type": "full_time",
    "department_id": "dept_123",
    "job_title_id": "job_456",
    "location_id": "loc_789",
    "manager_id": "emp_789012"
  },
  "compensation": {
    "salary": 110000,
    "currency": "USD",
    "pay_frequency": "monthly",
    "effective_date": "2023-04-01"
  }
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "employee": {
      "id": "emp_345678",
      "employee_id": "EMP005",
      "first_name": "Robert",
      "last_name": "Johnson",
      "email": "robert.johnson@example.com",
      "status": "active",
      "created_at": "2023-04-15T11:30:00Z"
    }
  }
}
```

#### Update Employee

```
PUT /employees/{employee_id}
```

Request body:
```json
{
  "phone": "+1-555-999-8888",
  "address": {
    "street": "789 Pine St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94109",
    "country": "USA"
  },
  "employment": {
    "job_title_id": "job_789",
    "manager_id": "emp_123456"
  },
  "compensation": {
    "salary": 125000,
    "effective_date": "2023-04-15"
  }
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "employee": {
      "id": "emp_345678",
      "employee_id": "EMP005",
      "first_name": "Robert",
      "last_name": "Johnson",
      "phone": "+1-555-999-8888",
      "employment": {
        "job_title": {
          "id": "job_789",
          "title": "Lead Developer"
        },
        "manager": {
          "id": "emp_123456",
          "name": "John Smith"
        }
      },
      "updated_at": "2023-04-15T14:45:00Z"
    }
  }
}
```

#### Delete Employee

```
DELETE /employees/{employee_id}
```

Response:
```json
{
  "status": "success",
  "data": {
    "message": "Employee successfully deleted"
  }
}
```

### Departments

#### List Departments

```
GET /departments
```

Response:
```json
{
  "status": "success",
  "data": {
    "departments": [
      {
        "id": "dept_123",
        "name": "Engineering",
        "code": "ENG",
        "description": "Software Engineering Department",
        "parent_id": null,
        "manager": {
          "id": "emp_789012",
          "name": "Jane Doe"
        },
        "employee_count": 45,
        "created_at": "2022-01-01T00:00:00Z"
      },
      {
        "id": "dept_456",
        "name": "Marketing",
        "code": "MKT",
        "description": "Marketing Department",
        "parent_id": null,
        "manager": {
          "id": "emp_234567",
          "name": "Michael Brown"
        },
        "employee_count": 20,
        "created_at": "2022-01-01T00:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 8,
      "count": 8,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 1
    }
  }
}
```

#### Get Department

```
GET /departments/{department_id}
```

Response:
```json
{
  "status": "success",
  "data": {
    "department": {
      "id": "dept_123",
      "name": "Engineering",
      "code": "ENG",
      "description": "Software Engineering Department",
      "parent_id": null,
      "manager": {
        "id": "emp_789012",
        "name": "Jane Doe"
      },
      "children": [
        {
          "id": "dept_124",
          "name": "Frontend Development",
          "code": "FE",
          "manager": {
            "id": "emp_345678",
            "name": "Robert Johnson"
          },
          "employee_count": 15
        },
        {
          "id": "dept_125",
          "name": "Backend Development",
          "code": "BE",
          "manager": {
            "id": "emp_456789",
            "name": "Sarah Williams"
          },
          "employee_count": 20
        }
      ],
      "employees": [
        {
          "id": "emp_789012",
          "name": "Jane Doe",
          "job_title": "Engineering Director"
        },
        {
          "id": "emp_123456",
          "name": "John Smith",
          "job_title": "Senior Developer"
        }
      ],
      "created_at": "2022-01-01T00:00:00Z",
      "updated_at": "2023-02-15T10:30:00Z"
    }
  }
}
```

#### Create Department

```
POST /departments
```

Request body:
```json
{
  "name": "Quality Assurance",
  "code": "QA",
  "description": "Quality Assurance Department",
  "parent_id": "dept_123",
  "manager_id": "emp_567890"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "department": {
      "id": "dept_126",
      "name": "Quality Assurance",
      "code": "QA",
      "description": "Quality Assurance Department",
      "parent_id": "dept_123",
      "manager": {
        "id": "emp_567890",
        "name": "David Wilson"
      },
      "created_at": "2023-04-15T15:30:00Z"
    }
  }
}
```

#### Update Department

```
PUT /departments/{department_id}
```

Request body:
```json
{
  "name": "QA & Testing",
  "description": "Quality Assurance and Testing Department",
  "manager_id": "emp_678901"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "department": {
      "id": "dept_126",
      "name": "QA & Testing",
      "code": "QA",
      "description": "Quality Assurance and Testing Department",
      "parent_id": "dept_123",
      "manager": {
        "id": "emp_678901",
        "name": "Emily Davis"
      },
      "updated_at": "2023-04-15T16:15:00Z"
    }
  }
}
```

#### Delete Department

```
DELETE /departments/{department_id}
```

Response:
```json
{
  "status": "success",
  "data": {
    "message": "Department successfully deleted"
  }
}
```

### Job Titles

#### List Job Titles

```
GET /job-titles
```

Response:
```json
{
  "status": "success",
  "data": {
    "job_titles": [
      {
        "id": "job_123",
        "title": "Software Engineer",
        "code": "SE",
        "department": {
          "id": "dept_123",
          "name": "Engineering"
        },
        "employee_count": 25,
        "created_at": "2022-01-01T00:00:00Z"
      },
      {
        "id": "job_456",
        "title": "Senior Developer",
        "code": "SD",
        "department": {
          "id": "dept_123",
          "name": "Engineering"
        },
        "employee_count": 10,
        "created_at": "2022-01-01T00:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 20,
      "count": 10,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 2,
      "links": {
        "next": "https://api.peoplex.com/v1/job-titles?page=2"
      }
    }
  }
}
```

### Locations

#### List Locations

```
GET /locations
```

Response:
```json
{
  "status": "success",
  "data": {
    "locations": [
      {
        "id": "loc_123",
        "name": "Headquarters",
        "address": {
          "street": "123 Main St",
          "city": "San Francisco",
          "state": "CA",
          "postal_code": "94105",
          "country": "USA"
        },
        "employee_count": 150,
        "created_at": "2022-01-01T00:00:00Z"
      },
      {
        "id": "loc_456",
        "name": "New York Office",
        "address": {
          "street": "456 Broadway",
          "city": "New York",
          "state": "NY",
          "postal_code": "10013",
          "country": "USA"
        },
        "employee_count": 75,
        "created_at": "2022-03-15T00:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 5,
      "count": 5,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 1
    }
  }
}
```

### Performance

#### List Performance Reviews

```
GET /performance/reviews
```

Response:
```json
{
  "status": "success",
  "data": {
    "reviews": [
      {
        "id": "rev_123",
        "cycle": {
          "id": "cycle_456",
          "name": "Annual Review 2023",
          "period": "2023"
        },
        "employee": {
          "id": "emp_123456",
          "name": "John Smith"
        },
        "reviewer": {
          "id": "emp_789012",
          "name": "Jane Doe"
        },
        "status": "completed",
        "overall_rating": 4.5,
        "submitted_at": "2023-03-15T10:30:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 150,
      "count": 10,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 15,
      "links": {
        "next": "https://api.peoplex.com/v1/performance/reviews?page=2"
      }
    }
  }
}
```

#### Get Performance Review

```
GET /performance/reviews/{review_id}
```

Response:
```json
{
  "status": "success",
  "data": {
    "review": {
      "id": "rev_123",
      "cycle": {
        "id": "cycle_456",
        "name": "Annual Review 2023",
        "period": "2023",
        "start_date": "2023-01-01",
        "end_date": "2023-12-31"
      },
      "employee": {
        "id": "emp_123456",
        "name": "John Smith",
        "job_title": "Senior Developer",
        "department": "Engineering"
      },
      "reviewer": {
        "id": "emp_789012",
        "name": "Jane Doe",
        "job_title": "Engineering Director"
      },
      "competencies": [
        {
          "id": "comp_123",
          "name": "Technical Skills",
          "rating": 5,
          "comments": "Excellent technical knowledge and problem-solving abilities."
        },
        {
          "id": "comp_456",
          "name": "Communication",
          "rating": 4,
          "comments": "Good communication skills, both written and verbal."
        },
        {
          "id": "comp_789",
          "name": "Teamwork",
          "rating": 4.5,
          "comments": "Works well with team members and contributes to team success."
        }
      ],
      "goals": [
        {
          "id": "goal_123",
          "title": "Complete Project X",
          "description": "Successfully deliver Project X by Q2",
          "status": "completed",
          "rating": 5,
          "comments": "Delivered ahead of schedule with excellent quality."
        },
        {
          "id": "goal_456",
          "title": "Mentor Junior Developers",
          "description": "Mentor at least 2 junior developers",
          "status": "completed",
          "rating": 4,
          "comments": "Successfully mentored 3 junior developers."
        }
      ],
      "overall_rating": 4.5,
      "strengths": "Technical expertise, problem-solving, mentoring abilities.",
      "areas_for_improvement": "Could improve on documentation practices.",
      "development_plan": "Focus on leadership skills development and advanced technical certifications.",
      "employee_comments": "I appreciate the feedback and will work on the suggested improvements.",
      "status": "completed",
      "created_at": "2023-01-15T09:00:00Z",
      "submitted_at": "2023-03-15T10:30:00Z",
      "completed_at": "2023-03-20T14:45:00Z"
    }
  }
}
```

### Learning

#### List Learning Programs

```
GET /learning/programs
```

Response:
```json
{
  "status": "success",
  "data": {
    "programs": [
      {
        "id": "prog_123",
        "name": "Leadership Development",
        "description": "Comprehensive leadership training program",
        "category": "leadership",
        "status": "active",
        "enrollment_count": 25,
        "created_at": "2022-06-01T00:00:00Z"
      },
      {
        "id": "prog_456",
        "title": "Technical Certification Path",
        "description": "Path to technical certifications",
        "category": "technical",
        "status": "active",
        "enrollment_count": 50,
        "created_at": "2022-07-15T00:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 8,
      "count": 8,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 1
    }
  }
}
```

### Payroll

#### List Payroll Runs

```
GET /payroll/runs
```

Response:
```json
{
  "status": "success",
  "data": {
    "payroll_runs": [
      {
        "id": "run_123",
        "period": {
          "year": 2023,
          "month": 3,
          "start_date": "2023-03-01",
          "end_date": "2023-03-31"
        },
        "status": "completed",
        "employee_count": 175,
        "total_amount": 1250000,
        "currency": "USD",
        "created_at": "2023-03-25T09:00:00Z",
        "processed_at": "2023-03-28T14:30:00Z"
      },
      {
        "id": "run_456",
        "period": {
          "year": 2023,
          "month": 4,
          "start_date": "2023-04-01",
          "end_date": "2023-04-30"
        },
        "status": "in_progress",
        "employee_count": 180,
        "created_at": "2023-04-25T09:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 15,
      "count": 10,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 2,
      "links": {
        "next": "https://api.peoplex.com/v1/payroll/runs?page=2"
      }
    }
  }
}
```

### Workflows

#### List Workflow Definitions

```
GET /workflows/definitions
```

Response:
```json
{
  "status": "success",
  "data": {
    "workflows": [
      {
        "id": "wf_123",
        "name": "Leave Approval",
        "description": "Workflow for leave request approval",
        "trigger_type": "form_submission",
        "trigger_config": {
          "form_id": "leave_request"
        },
        "is_active": true,
        "step_count": 3,
        "created_at": "2022-05-10T00:00:00Z"
      },
      {
        "id": "wf_456",
        "name": "Expense Approval",
        "description": "Workflow for expense approval",
        "trigger_type": "form_submission",
        "trigger_config": {
          "form_id": "expense_report"
        },
        "is_active": true,
        "step_count": 2,
        "created_at": "2022-06-15T00:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 12,
      "count": 10,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 2,
      "links": {
        "next": "https://api.peoplex.com/v1/workflows/definitions?page=2"
      }
    }
  }
}
```

### Forms

#### List Form Templates

```
GET /forms/templates
```

Response:
```json
{
  "status": "success",
  "data": {
    "templates": [
      {
        "id": "form_123",
        "name": "Leave Request Form",
        "description": "Form for requesting leave",
        "form_type": "leave_request",
        "is_published": true,
        "field_count": 4,
        "submission_count": 250,
        "created_at": "2022-04-01T00:00:00Z"
      },
      {
        "id": "form_456",
        "name": "Expense Report Form",
        "description": "Form for submitting expense reports",
        "form_type": "expense_report",
        "is_published": true,
        "field_count": 5,
        "submission_count": 120,
        "created_at": "2022-04-15T00:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 15,
      "count": 10,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 2,
      "links": {
        "next": "https://api.peoplex.com/v1/forms/templates?page=2"
      }
    }
  }
}
```

### Dashboards

#### List Dashboards

```
GET /dashboards
```

Response:
```json
{
  "status": "success",
  "data": {
    "dashboards": [
      {
        "id": "dash_123",
        "name": "HR Overview",
        "description": "Overview of key HR metrics",
        "is_public": true,
        "widget_count": 6,
        "created_at": "2022-08-01T00:00:00Z"
      },
      {
        "id": "dash_456",
        "name": "Recruitment Dashboard",
        "description": "Recruitment metrics and analytics",
        "is_public": false,
        "widget_count": 4,
        "created_at": "2022-09-15T00:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "total": 8,
      "count": 8,
      "per_page": 10,
      "current_page": 1,
      "total_pages": 1
    }
  }
}
```

## Webhooks

People X supports webhooks to notify external systems about events in real-time.

### Webhook Events

Available webhook events:

- `employee.created`
- `employee.updated`
- `employee.deleted`
- `department.created`
- `department.updated`
- `department.deleted`
- `job_title.created`
- `job_title.updated`
- `job_title.deleted`
- `performance.review.submitted`
- `performance.review.completed`
- `learning.enrollment.created`
- `learning.course.completed`
- `payroll.run.started`
- `payroll.run.completed`
- `workflow.instance.created`
- `workflow.instance.updated`
- `workflow.instance.completed`
- `form.submission.created`

### Register Webhook

```
POST /webhooks
```

Request body:
```json
{
  "url": "https://your-server.com/webhook-endpoint",
  "events": [
    "employee.created",
    "employee.updated",
    "employee.deleted"
  ],
  "description": "Employee updates webhook",
  "is_active": true,
  "secret": "your_webhook_secret"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "webhook": {
      "id": "wh_123456",
      "url": "https://your-server.com/webhook-endpoint",
      "events": [
        "employee.created",
        "employee.updated",
        "employee.deleted"
      ],
      "description": "Employee updates webhook",
      "is_active": true,
      "created_at": "2023-04-15T17:30:00Z"
    }
  }
}
```

### Webhook Payload

Example webhook payload:

```json
{
  "id": "evt_123456",
  "event": "employee.created",
  "created_at": "2023-04-15T18:00:00Z",
  "data": {
    "employee": {
      "id": "emp_345678",
      "employee_id": "EMP005",
      "first_name": "Robert",
      "last_name": "Johnson",
      "email": "robert.johnson@example.com",
      "status": "active",
      "created_at": "2023-04-15T18:00:00Z"
    }
  }
}
```

### Webhook Security

Webhooks include a signature in the `X-PeopleX-Signature` header. Verify this signature to ensure the webhook is from People X:

```
X-PeopleX-Signature: t=1681578000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
```

To verify:
1. Extract the timestamp (`t`) and signature (`v1`)
2. Create a string: `{timestamp}.{payload}` where `payload` is the raw request body
3. Compute HMAC-SHA256 of this string using your webhook secret
4. Compare with the signature in the header

## Error Codes

| Code | Description |
|------|-------------|
| `authentication_error` | Authentication failed |
| `authorization_error` | Not authorized to perform this action |
| `invalid_request` | The request was invalid |
| `resource_not_found` | The requested resource was not found |
| `validation_error` | Validation failed for the request |
| `rate_limit_exceeded` | Rate limit has been exceeded |
| `internal_error` | An internal server error occurred |

## Changelog

### v1.0.0 (2023-04-01)
- Initial API release

### v1.1.0 (2023-04-15)
- Added webhook support
- Added bulk operations for employees
- Improved error handling and validation

## Support

For API support, contact api-support@peoplex.com or visit our developer portal at https://developers.peoplex.com.