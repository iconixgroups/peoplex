// Simple test server with CRUD operations for all modules
const http = require('http');
const url = require('url');

// Sample data
const employees = [
  { id: 1, first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', department: 'Engineering', job_title: 'Software Engineer', status: 'active' },
  { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', department: 'Marketing', job_title: 'Marketing Manager', status: 'active' },
  { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike.johnson@example.com', department: 'HR', job_title: 'HR Specialist', status: 'active' },
  { id: 4, first_name: 'Sarah', last_name: 'Williams', email: 'sarah.williams@example.com', department: 'Finance', job_title: 'Financial Analyst', status: 'active' },
  { id: 5, first_name: 'David', last_name: 'Brown', email: 'david.brown@example.com', department: 'Operations', job_title: 'Operations Manager', status: 'active' }
];

const attendance = [
  { id: 1, employee_id: 1, date: '2025-04-15', status: 'present', check_in: '09:00', check_out: '17:30' },
  { id: 2, employee_id: 2, date: '2025-04-15', status: 'present', check_in: '08:45', check_out: '17:15' },
  { id: 3, employee_id: 3, date: '2025-04-15', status: 'present', check_in: '09:15', check_out: '18:00' },
  { id: 4, employee_id: 4, date: '2025-04-15', status: 'absent', check_in: null, check_out: null },
  { id: 5, employee_id: 5, date: '2025-04-15', status: 'present', check_in: '09:30', check_out: '17:45' }
];

const leaveRequests = [
  { id: 1, employee_id: 1, start_date: '2025-04-20', end_date: '2025-04-22', type: 'annual', status: 'pending', reason: 'Family vacation' },
  { id: 2, employee_id: 2, start_date: '2025-04-18', end_date: '2025-04-18', type: 'sick', status: 'approved', reason: 'Doctor appointment' },
  { id: 3, employee_id: 3, start_date: '2025-05-01', end_date: '2025-05-03', type: 'annual', status: 'approved', reason: 'Personal time' },
  { id: 4, employee_id: 4, start_date: '2025-04-25', end_date: '2025-04-25', type: 'personal', status: 'rejected', reason: 'Family matter' }
];

const recruitmentRequisitions = [
  { id: 1, title: 'Software Engineer', department: 'Engineering', positions: 2, status: 'open', posted_date: '2025-03-15' },
  { id: 2, title: 'Marketing Specialist', department: 'Marketing', positions: 1, status: 'open', posted_date: '2025-03-20' },
  { id: 3, title: 'Financial Analyst', department: 'Finance', positions: 1, status: 'closed', posted_date: '2025-02-10' }
];

const candidates = [
  { id: 1, first_name: 'Alex', last_name: 'Johnson', email: 'alex.johnson@example.com', phone: '555-1234', position_applied: 'Software Engineer', status: 'screening' },
  { id: 2, first_name: 'Maria', last_name: 'Garcia', email: 'maria.garcia@example.com', phone: '555-5678', position_applied: 'Marketing Specialist', status: 'interview' }
];

const performanceReviews = [
  { id: 1, employee_id: 1, review_period: 'Q1 2025', score: 4.5, status: 'completed' },
  { id: 2, employee_id: 2, review_period: 'Q1 2025', score: 4.2, status: 'completed' },
  { id: 3, employee_id: 3, review_period: 'Q1 2025', score: 3.8, status: 'in_progress' }
];

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Handle login requests
  if (req.method === 'POST' && path === '/api/v1/auth/login') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('Login attempt with:', data);
        
        // Check credentials
        if (data.email === 'test@example.com' && data.password === 'Test@123') {
          // Success response
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: {
              token: 'fake-jwt-token',
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              refreshToken: 'fake-refresh-token',
              user: {
                id: '1',
                username: 'testuser',
                first_name: 'Test',
                last_name: 'User',
                is_admin: true
              }
            }
          }));
        } else {
          // Invalid credentials
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(401);
          res.end(JSON.stringify({
            error: 'Invalid email or password'
          }));
        }
      } catch (err) {
        // Bad request
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(400);
        res.end(JSON.stringify({
          error: 'Invalid request format'
        }));
      }
    });
    return;
  }
  
  // EMPLOYEES ENDPOINTS
  if (path === '/api/v1/employees') {
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          employees: employees
        }
      }));
      return;
    }
    
    if (req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const newEmployee = {
            id: employees.length + 1,
            ...data,
            status: 'active'
          };
          
          employees.push(newEmployee);
          
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(201);
          res.end(JSON.stringify({
            status: 'success',
            data: {
              employee: newEmployee
            }
          }));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(400);
          res.end(JSON.stringify({
            error: 'Invalid request format'
          }));
        }
      });
      return;
    }
  }
  
  // Single employee operations
  if (path.match(/^\/api\/v1\/employees\/\d+$/)) {
    const id = parseInt(path.split('/').pop());
    const employee = employees.find(emp => emp.id === id);
    
    if (!employee) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(404);
      res.end(JSON.stringify({
        error: 'Employee not found'
      }));
      return;
    }
    
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          employee
        }
      }));
      return;
    }
    
    if (req.method === 'PUT') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const index = employees.findIndex(emp => emp.id === id);
          
          employees[index] = {
            ...employee,
            ...data,
            id  // Preserve ID
          };
          
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: {
              employee: employees[index]
            }
          }));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(400);
          res.end(JSON.stringify({
            error: 'Invalid request format'
          }));
        }
      });
      return;
    }
    
    if (req.method === 'DELETE') {
      const index = employees.findIndex(emp => emp.id === id);
      employees.splice(index, 1);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: null
      }));
      return;
    }
  }
  
  // ATTENDANCE ENDPOINTS
  if (path === '/api/v1/attendance') {
    if (req.method === 'GET') {
      const date = query.date || new Date().toISOString().split('T')[0];
      const filteredAttendance = attendance.filter(a => a.date === date);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          date,
          records: filteredAttendance,
          summary: {
            present: filteredAttendance.filter(a => a.status === 'present').length,
            absent: filteredAttendance.filter(a => a.status === 'absent').length,
            late: filteredAttendance.filter(a => a.status === 'late').length,
            half_day: filteredAttendance.filter(a => a.status === 'half_day').length
          }
        }
      }));
      return;
    }
    
    if (req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const newAttendance = {
            id: attendance.length + 1,
            ...data
          };
          
          attendance.push(newAttendance);
          
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(201);
          res.end(JSON.stringify({
            status: 'success',
            data: {
              attendance: newAttendance
            }
          }));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(400);
          res.end(JSON.stringify({
            error: 'Invalid request format'
          }));
        }
      });
      return;
    }
  }
  
  // LEAVE REQUESTS ENDPOINTS
  if (path === '/api/v1/leave-requests') {
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          leave_requests: leaveRequests
        }
      }));
      return;
    }
    
    if (req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const newLeaveRequest = {
            id: leaveRequests.length + 1,
            ...data,
            status: 'pending'
          };
          
          leaveRequests.push(newLeaveRequest);
          
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(201);
          res.end(JSON.stringify({
            status: 'success',
            data: {
              leave_request: newLeaveRequest
            }
          }));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(400);
          res.end(JSON.stringify({
            error: 'Invalid request format'
          }));
        }
      });
      return;
    }
  }
  
  // Single leave request operations
  if (path.match(/^\/api\/v1\/leave-requests\/\d+$/)) {
    const id = parseInt(path.split('/').pop());
    const leaveRequest = leaveRequests.find(lr => lr.id === id);
    
    if (!leaveRequest) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(404);
      res.end(JSON.stringify({
        error: 'Leave request not found'
      }));
      return;
    }
    
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          leave_request: leaveRequest
        }
      }));
      return;
    }
    
    if (req.method === 'PUT') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const index = leaveRequests.findIndex(lr => lr.id === id);
          
          leaveRequests[index] = {
            ...leaveRequest,
            ...data,
            id  // Preserve ID
          };
          
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(200);
          res.end(JSON.stringify({
            status: 'success',
            data: {
              leave_request: leaveRequests[index]
            }
          }));
        } catch (err) {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(400);
          res.end(JSON.stringify({
            error: 'Invalid request format'
          }));
        }
      });
      return;
    }
    
    if (req.method === 'DELETE') {
      const index = leaveRequests.findIndex(lr => lr.id === id);
      leaveRequests.splice(index, 1);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: null
      }));
      return;
    }
  }
  
  // RECRUITMENT ENDPOINTS
  if (path === '/api/v1/recruitment/requisitions') {
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          requisitions: recruitmentRequisitions
        }
      }));
      return;
    }
  }
  
  if (path === '/api/v1/recruitment/candidates') {
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          candidates: candidates
        }
      }));
      return;
    }
  }
  
  // PERFORMANCE ENDPOINTS
  if (path === '/api/v1/performance/reviews') {
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        data: {
          reviews: performanceReviews
        }
      }));
      return;
    }
  }
  
  // Health check endpoint
  if (req.method === 'GET' && path === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'UP', version: '1.0.0' }));
    return;
  }
  
  // Default 404 response
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(404);
  res.end(JSON.stringify({
    status: 'error',
    error: `Route ${req.method} ${path} not found`
  }));
});

// Start the server on port 4000
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- Authentication:');
  console.log('  POST /api/v1/auth/login');
  console.log('- Employees:');
  console.log('  GET /api/v1/employees');
  console.log('  POST /api/v1/employees');
  console.log('  GET /api/v1/employees/:id');
  console.log('  PUT /api/v1/employees/:id');
  console.log('  DELETE /api/v1/employees/:id');
  console.log('- Attendance:');
  console.log('  GET /api/v1/attendance');
  console.log('  POST /api/v1/attendance');
  console.log('- Leave:');
  console.log('  GET /api/v1/leave-requests');
  console.log('  POST /api/v1/leave-requests');
  console.log('  GET /api/v1/leave-requests/:id');
  console.log('  PUT /api/v1/leave-requests/:id');
  console.log('  DELETE /api/v1/leave-requests/:id');
  console.log('- Recruitment:');
  console.log('  GET /api/v1/recruitment/requisitions');
  console.log('  GET /api/v1/recruitment/candidates');
  console.log('- Performance:');
  console.log('  GET /api/v1/performance/reviews');
  console.log('- System:');
  console.log('  GET /health');
}); 