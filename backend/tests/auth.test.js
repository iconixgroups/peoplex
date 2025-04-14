// Authentication Tests for People X
const request = require('supertest');
const app = require('../src/app');
const { testPool, resetDatabase, generateTestToken } = require('./setup');

let testData;

beforeAll(async () => {
  testData = await resetDatabase();
});

afterAll(async () => {
  await testPool.end();
});

describe('Authentication API', () => {
  describe('POST /api/security/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/security/register')
        .send({
          email: 'newuser@test.com',
          username: 'newuser',
          password: 'Password123',
          first_name: 'New',
          last_name: 'User',
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'newuser@test.com');
    });
    
    it('should return error for duplicate email', async () => {
      const res = await request(app)
        .post('/api/security/register')
        .send({
          email: 'admin@test.com', // Already exists from setup
          username: 'newadmin',
          password: 'Password123',
          first_name: 'New',
          last_name: 'Admin',
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
    
    it('should return error for missing required fields', async () => {
      const res = await request(app)
        .post('/api/security/register')
        .send({
          email: 'incomplete@test.com',
          // Missing username and other required fields
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/security/login', () => {
    it('should login with valid email and password', async () => {
      const res = await request(app)
        .post('/api/security/login')
        .send({
          email: 'admin@test.com',
          password: 'TestPassword123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'admin@test.com');
    });
    
    it('should login with valid username and password', async () => {
      const res = await request(app)
        .post('/api/security/login')
        .send({
          username: 'admin',
          password: 'TestPassword123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('username', 'admin');
    });
    
    it('should return error for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/security/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
    
    it('should return error for non-existent user', async () => {
      const res = await request(app)
        .post('/api/security/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/security/profile', () => {
    it('should get user profile with valid token', async () => {
      const token = generateTestToken(testData.userId, 'admin', testData.organizationId);
      
      const res = await request(app)
        .get('/api/security/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('id', testData.userId);
      expect(res.body.user).toHaveProperty('email', 'admin@test.com');
    });
    
    it('should return error for invalid token', async () => {
      const res = await request(app)
        .get('/api/security/profile')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
    
    it('should return error for missing token', async () => {
      const res = await request(app)
        .get('/api/security/profile');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /api/security/profile', () => {
    it('should update user profile with valid token', async () => {
      const token = generateTestToken(testData.userId, 'admin', testData.organizationId);
      
      const res = await request(app)
        .put('/api/security/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          first_name: 'Updated',
          last_name: 'Admin'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('first_name', 'Updated');
      expect(res.body.user).toHaveProperty('last_name', 'Admin');
    });
    
    it('should update password with valid current password', async () => {
      const token = generateTestToken(testData.userId, 'admin', testData.organizationId);
      
      const res = await request(app)
        .put('/api/security/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'TestPassword123',
          new_password: 'NewPassword123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Profile updated successfully');
      
      // Verify login with new password works
      const loginRes = await request(app)
        .post('/api/security/login')
        .send({
          email: 'admin@test.com',
          password: 'NewPassword123'
        });
      
      expect(loginRes.statusCode).toEqual(200);
    });
    
    it('should return error for invalid current password', async () => {
      const token = generateTestToken(testData.userId, 'admin', testData.organizationId);
      
      const res = await request(app)
        .put('/api/security/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'WrongPassword',
          new_password: 'AnotherPassword123'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});
