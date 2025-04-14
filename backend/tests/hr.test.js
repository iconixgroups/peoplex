// HR Module Tests for People X
const request = require('supertest');
const app = require('../src/app');
const { testPool, resetDatabase, generateTestToken } = require('./setup');

let testData;
let token;
let employeeId;

beforeAll(async () => {
  testData = await resetDatabase();
  token = generateTestToken(testData.userId, 'admin', testData.organizationId);
});

afterAll(async () => {
  await testPool.end();
});

describe('HR API', () => {
  describe('Employee API', () => {
    it('should create a new employee', async () => {
      const res = await request(app)
        .post('/api/hr/employees')
        .set('Authorization', `Bearer ${token}`)
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@test.com',
          phone: '555-123-4567',
          date_of_birth: '1990-01-15',
          gender: 'male',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postal_code: '12345',
          country: 'USA',
          hire_date: '2023-01-10',
          employment_status: 'active',
          employment_type: 'full_time',
          department_id: 1, // Engineering department from setup
          job_title_id: 1, // Software Engineer from setup
          location_id: 1, // Headquarters from setup
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('employee');
      expect(res.body.employee).toHaveProperty('first_name', 'John');
      expect(res.body.employee).toHaveProperty('last_name', 'Doe');
      expect(res.body.employee).toHaveProperty('email', 'john.doe@test.com');
      
      // Store employee ID for later tests
      employeeId = res.body.employee.id;
    });
    
    it('should get all employees', async () => {
      const res = await request(app)
        .get('/api/hr/employees')
        .query({ organizationId: testData.organizationId })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('employees');
      expect(res.body.employees).toBeInstanceOf(Array);
      expect(res.body.employees.length).toBeGreaterThan(0);
    });
    
    it('should get employee by ID', async () => {
      const res = await request(app)
        .get(`/api/hr/employees/${employeeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('employee');
      expect(res.body.employee).toHaveProperty('id', employeeId);
      expect(res.body.employee).toHaveProperty('first_name', 'John');
      expect(res.body.employee).toHaveProperty('last_name', 'Doe');
    });
    
    it('should update employee', async () => {
      const res = await request(app)
        .put(`/api/hr/employees/${employeeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          first_name: 'Johnny',
          phone: '555-987-6543',
          address: '456 Updated St'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('employee');
      expect(res.body.employee).toHaveProperty('first_name', 'Johnny');
      expect(res.body.employee).toHaveProperty('phone', '555-987-6543');
    });
  });
  
  describe('Attendance API', () => {
    let attendanceId;
    
    it('should record clock in', async () => {
      const res = await request(app)
        .post('/api/hr/attendance/clock-in')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employee_id: employeeId,
          clock_in_time: new Date().toISOString(),
          location: 'Office',
          notes: 'Regular day'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('attendance');
      expect(res.body.attendance).toHaveProperty('employee_id', employeeId);
      expect(res.body.attendance).toHaveProperty('clock_in_time');
      
      // Store attendance ID for later tests
      attendanceId = res.body.attendance.id;
    });
    
    it('should record clock out', async () => {
      const res = await request(app)
        .put(`/api/hr/attendance/${attendanceId}/clock-out`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          clock_out_time: new Date().toISOString(),
          notes: 'Completed tasks'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('attendance');
      expect(res.body.attendance).toHaveProperty('id', attendanceId);
      expect(res.body.attendance).toHaveProperty('clock_out_time');
    });
    
    it('should get employee attendance', async () => {
      const res = await request(app)
        .get(`/api/hr/attendance/employee/${employeeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('attendance');
      expect(res.body.attendance).toBeInstanceOf(Array);
      expect(res.body.attendance.length).toBeGreaterThan(0);
    });
  });
  
  describe('Leave API', () => {
    let leaveRequestId;
    
    it('should create a leave request', async () => {
      const res = await request(app)
        .post('/api/hr/leave')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employee_id: employeeId,
          leave_type_id: 1, // Assuming leave type ID 1 exists
          start_date: '2023-05-10',
          end_date: '2023-05-15',
          reason: 'Vacation',
          status: 'pending'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('leaveRequest');
      expect(res.body.leaveRequest).toHaveProperty('employee_id', employeeId);
      expect(res.body.leaveRequest).toHaveProperty('start_date');
      expect(res.body.leaveRequest).toHaveProperty('end_date');
      
      // Store leave request ID for later tests
      leaveRequestId = res.body.leaveRequest.id;
    });
    
    it('should get employee leave requests', async () => {
      const res = await request(app)
        .get(`/api/hr/leave/employee/${employeeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('leaveRequests');
      expect(res.body.leaveRequests).toBeInstanceOf(Array);
      expect(res.body.leaveRequests.length).toBeGreaterThan(0);
    });
    
    it('should approve leave request', async () => {
      const res = await request(app)
        .put(`/api/hr/leave/${leaveRequestId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          approved_by: testData.userId,
          comments: 'Approved as requested'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('leaveRequest');
      expect(res.body.leaveRequest).toHaveProperty('id', leaveRequestId);
      expect(res.body.leaveRequest).toHaveProperty('status', 'approved');
    });
    
    it('should get leave request by ID', async () => {
      const res = await request(app)
        .get(`/api/hr/leave/${leaveRequestId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('leaveRequest');
      expect(res.body.leaveRequest).toHaveProperty('id', leaveRequestId);
      expect(res.body.leaveRequest).toHaveProperty('status', 'approved');
    });
  });
});
