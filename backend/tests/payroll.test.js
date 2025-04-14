// Payroll Module Tests for People X
const request = require('supertest');
const app = require('../src/app');
const { testPool, resetDatabase, generateTestToken } = require('./setup');

let testData;
let token;
let employeeId;
let periodId;
let runId;
let payslipId;

beforeAll(async () => {
  testData = await resetDatabase();
  token = generateTestToken(testData.userId, 'admin', testData.organizationId);
  
  // Create a test employee for payroll tests
  const employeeRes = await request(app)
    .post('/api/hr/employees')
    .set('Authorization', `Bearer ${token}`)
    .send({
      first_name: 'Payroll',
      last_name: 'Employee',
      email: 'payroll.employee@test.com',
      phone: '555-987-6543',
      hire_date: '2023-01-01',
      employment_status: 'active',
      employment_type: 'full_time',
      department_id: 1,
      job_title_id: 1,
      location_id: 1,
      organization_id: testData.organizationId
    });
  
  employeeId = employeeRes.body.employee.id;
  
  // Create salary for the employee
  await request(app)
    .post('/api/compensation/salaries')
    .set('Authorization', `Bearer ${token}`)
    .send({
      employee_id: employeeId,
      salary_amount: 75000,
      currency: 'USD',
      salary_type: 'base',
      payment_frequency: 'monthly',
      effective_date: '2023-01-01',
      organization_id: testData.organizationId
    });
});

afterAll(async () => {
  await testPool.end();
});

describe('Payroll API', () => {
  describe('Payroll Period API', () => {
    it('should create a new payroll period', async () => {
      const res = await request(app)
        .post('/api/payroll/periods')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'March 2023',
          start_date: '2023-03-01',
          end_date: '2023-03-31',
          payment_date: '2023-04-05',
          status: 'open',
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('period');
      expect(res.body.period).toHaveProperty('name', 'March 2023');
      expect(res.body.period).toHaveProperty('status', 'open');
      
      // Store period ID for later tests
      periodId = res.body.period.id;
    });
    
    it('should get all payroll periods', async () => {
      const res = await request(app)
        .get('/api/payroll/periods')
        .query({ organizationId: testData.organizationId })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('periods');
      expect(res.body.periods).toBeInstanceOf(Array);
      expect(res.body.periods.length).toBeGreaterThan(0);
    });
    
    it('should get payroll period by ID', async () => {
      const res = await request(app)
        .get(`/api/payroll/periods/${periodId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('period');
      expect(res.body.period).toHaveProperty('id', periodId);
      expect(res.body.period).toHaveProperty('name', 'March 2023');
    });
    
    it('should update payroll period', async () => {
      const res = await request(app)
        .put(`/api/payroll/periods/${periodId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          payment_date: '2023-04-07',
          notes: 'Payment date adjusted due to holiday'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('period');
      expect(res.body.period).toHaveProperty('payment_date', '2023-04-07T00:00:00.000Z');
      expect(res.body.period).toHaveProperty('notes', 'Payment date adjusted due to holiday');
    });
  });
  
  describe('Payroll Run API', () => {
    it('should create a new payroll run', async () => {
      const res = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          period_id: periodId,
          name: 'March 2023 Regular Run',
          run_date: new Date().toISOString(),
          status: 'draft',
          run_by: testData.userId,
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('run');
      expect(res.body.run).toHaveProperty('period_id', periodId);
      expect(res.body.run).toHaveProperty('name', 'March 2023 Regular Run');
      expect(res.body.run).toHaveProperty('status', 'draft');
      
      // Store run ID for later tests
      runId = res.body.run.id;
    });
    
    it('should get payroll runs for a period', async () => {
      const res = await request(app)
        .get(`/api/payroll/runs/period/${periodId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('runs');
      expect(res.body.runs).toBeInstanceOf(Array);
      expect(res.body.runs.length).toBeGreaterThan(0);
    });
    
    it('should generate payslips for a run', async () => {
      const res = await request(app)
        .post(`/api/payroll/runs/${runId}/generate-payslips`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          employee_ids: [employeeId]
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Payslips generated successfully');
      expect(res.body).toHaveProperty('count', 1);
      
      // Get the payslip ID for later tests
      const payslipsRes = await request(app)
        .get(`/api/payroll/payslips/run/${runId}`)
        .set('Authorization', `Bearer ${token}`);
      
      payslipId = payslipsRes.body.payslips[0].id;
    });
    
    it('should process a payroll run', async () => {
      const res = await request(app)
        .put(`/api/payroll/runs/${runId}/process`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          processed_by: testData.userId,
          notes: 'Regular monthly payroll'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('run');
      expect(res.body.run).toHaveProperty('id', runId);
      expect(res.body.run).toHaveProperty('status', 'processed');
    });
    
    it('should approve a payroll run', async () => {
      const res = await request(app)
        .put(`/api/payroll/runs/${runId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          approved_by: testData.userId,
          approval_notes: 'Approved by finance department'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('run');
      expect(res.body.run).toHaveProperty('id', runId);
      expect(res.body.run).toHaveProperty('status', 'approved');
    });
  });
  
  describe('Payslip API', () => {
    it('should get payslips for a run', async () => {
      const res = await request(app)
        .get(`/api/payroll/payslips/run/${runId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('payslips');
      expect(res.body.payslips).toBeInstanceOf(Array);
      expect(res.body.payslips.length).toBeGreaterThan(0);
    });
    
    it('should get payslips for an employee', async () => {
      const res = await request(app)
        .get(`/api/payroll/payslips/employee/${employeeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('payslips');
      expect(res.body.payslips).toBeInstanceOf(Array);
      expect(res.body.payslips.length).toBeGreaterThan(0);
    });
    
    it('should get payslip by ID', async () => {
      const res = await request(app)
        .get(`/api/payroll/payslips/${payslipId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('payslip');
      expect(res.body.payslip).toHaveProperty('id', payslipId);
      expect(res.body.payslip).toHaveProperty('employee_id', employeeId);
      expect(res.body.payslip).toHaveProperty('run_id', runId);
    });
    
    it('should update payslip', async () => {
      const res = await request(app)
        .put(`/api/payroll/payslips/${payslipId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          adjustments: JSON.stringify([
            { type: 'bonus', description: 'Performance bonus', amount: 1000 }
          ]),
          notes: 'Added performance bonus'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('payslip');
      expect(res.body.payslip).toHaveProperty('id', payslipId);
      expect(res.body.payslip).toHaveProperty('adjustments');
      expect(res.body.payslip).toHaveProperty('notes', 'Added performance bonus');
    });
  });
});
