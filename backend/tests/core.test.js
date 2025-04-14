// Core Module Tests for People X
const request = require('supertest');
const app = require('../src/app');
const { testPool, resetDatabase, generateTestToken } = require('./setup');

let testData;
let token;

beforeAll(async () => {
  testData = await resetDatabase();
  token = generateTestToken(testData.userId, 'admin', testData.organizationId);
});

afterAll(async () => {
  await testPool.end();
});

describe('Core API', () => {
  describe('Organization API', () => {
    it('should get organization details', async () => {
      const res = await request(app)
        .get(`/api/core/organizations/${testData.organizationId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('organization');
      expect(res.body.organization).toHaveProperty('id', testData.organizationId);
      expect(res.body.organization).toHaveProperty('name', 'Test Organization');
    });
    
    it('should update organization details', async () => {
      const res = await request(app)
        .put(`/api/core/organizations/${testData.organizationId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Organization Name',
          industry: 'Technology',
          size: '50-100'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('organization');
      expect(res.body.organization).toHaveProperty('name', 'Updated Organization Name');
      expect(res.body.organization).toHaveProperty('industry', 'Technology');
    });
  });
  
  describe('Department API', () => {
    let departmentId;
    
    it('should get all departments', async () => {
      const res = await request(app)
        .get('/api/core/departments')
        .query({ organizationId: testData.organizationId })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('departments');
      expect(res.body.departments).toBeInstanceOf(Array);
      expect(res.body.departments.length).toBeGreaterThan(0);
      
      // Store a department ID for later tests
      departmentId = res.body.departments[0].id;
    });
    
    it('should create a new department', async () => {
      const res = await request(app)
        .post('/api/core/departments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Finance',
          description: 'Finance Department',
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('department');
      expect(res.body.department).toHaveProperty('name', 'Finance');
    });
    
    it('should get department by ID', async () => {
      const res = await request(app)
        .get(`/api/core/departments/${departmentId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('department');
      expect(res.body.department).toHaveProperty('id', departmentId);
    });
    
    it('should update department', async () => {
      const res = await request(app)
        .put(`/api/core/departments/${departmentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Engineering Team',
          description: 'Updated description'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('department');
      expect(res.body.department).toHaveProperty('name', 'Engineering Team');
    });
  });
  
  describe('Location API', () => {
    let locationId;
    
    it('should get all locations', async () => {
      const res = await request(app)
        .get('/api/core/locations')
        .query({ organizationId: testData.organizationId })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('locations');
      expect(res.body.locations).toBeInstanceOf(Array);
      expect(res.body.locations.length).toBeGreaterThan(0);
      
      // Store a location ID for later tests
      locationId = res.body.locations[0].id;
    });
    
    it('should create a new location', async () => {
      const res = await request(app)
        .post('/api/core/locations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Chicago Office',
          address: '789 Michigan Ave',
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
          postal_code: '60601',
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('location');
      expect(res.body.location).toHaveProperty('name', 'Chicago Office');
    });
    
    it('should get location by ID', async () => {
      const res = await request(app)
        .get(`/api/core/locations/${locationId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('location');
      expect(res.body.location).toHaveProperty('id', locationId);
    });
    
    it('should update location', async () => {
      const res = await request(app)
        .put(`/api/core/locations/${locationId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'SF Headquarters',
          address: '123 Updated St'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('location');
      expect(res.body.location).toHaveProperty('name', 'SF Headquarters');
    });
  });
  
  describe('Job Title API', () => {
    let jobTitleId;
    
    it('should get all job titles', async () => {
      const res = await request(app)
        .get('/api/core/job-titles')
        .query({ organizationId: testData.organizationId })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('jobTitles');
      expect(res.body.jobTitles).toBeInstanceOf(Array);
      expect(res.body.jobTitles.length).toBeGreaterThan(0);
      
      // Store a job title ID for later tests
      jobTitleId = res.body.jobTitles[0].id;
    });
    
    it('should create a new job title', async () => {
      const res = await request(app)
        .post('/api/core/job-titles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Product Manager',
          description: 'Manages product development',
          department_id: 1, // Engineering department from setup
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('jobTitle');
      expect(res.body.jobTitle).toHaveProperty('title', 'Product Manager');
    });
    
    it('should get job title by ID', async () => {
      const res = await request(app)
        .get(`/api/core/job-titles/${jobTitleId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('jobTitle');
      expect(res.body.jobTitle).toHaveProperty('id', jobTitleId);
    });
    
    it('should update job title', async () => {
      const res = await request(app)
        .put(`/api/core/job-titles/${jobTitleId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Senior Software Engineer',
          description: 'Updated description'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('jobTitle');
      expect(res.body.jobTitle).toHaveProperty('title', 'Senior Software Engineer');
    });
  });
});
