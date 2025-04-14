// Learning Module Tests for People X
const request = require('supertest');
const app = require('../src/app');
const { testPool, resetDatabase, generateTestToken } = require('./setup');

let testData;
let token;
let employeeId;
let courseId;
let moduleId;
let enrollmentId;

beforeAll(async () => {
  testData = await resetDatabase();
  token = generateTestToken(testData.userId, 'admin', testData.organizationId);
  
  // Create a test employee for learning tests
  const employeeRes = await request(app)
    .post('/api/hr/employees')
    .set('Authorization', `Bearer ${token}`)
    .send({
      first_name: 'Learning',
      last_name: 'Student',
      email: 'learning.student@test.com',
      phone: '555-123-4567',
      hire_date: '2023-02-15',
      employment_status: 'active',
      employment_type: 'full_time',
      department_id: 1,
      job_title_id: 1,
      location_id: 1,
      organization_id: testData.organizationId
    });
  
  employeeId = employeeRes.body.employee.id;
});

afterAll(async () => {
  await testPool.end();
});

describe('Learning API', () => {
  describe('Course API', () => {
    it('should create a new course', async () => {
      const res = await request(app)
        .post('/api/learning/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Introduction to JavaScript',
          description: 'Learn the fundamentals of JavaScript programming',
          category: 'Technical',
          format: 'online',
          duration_hours: 10,
          credits: 2,
          prerequisites: JSON.stringify(['Basic HTML knowledge']),
          status: 'active',
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('course');
      expect(res.body.course).toHaveProperty('title', 'Introduction to JavaScript');
      expect(res.body.course).toHaveProperty('status', 'active');
      
      // Store course ID for later tests
      courseId = res.body.course.id;
    });
    
    it('should get all courses', async () => {
      const res = await request(app)
        .get('/api/learning/courses')
        .query({ organizationId: testData.organizationId })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('courses');
      expect(res.body.courses).toBeInstanceOf(Array);
      expect(res.body.courses.length).toBeGreaterThan(0);
    });
    
    it('should get course by ID', async () => {
      const res = await request(app)
        .get(`/api/learning/courses/${courseId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('course');
      expect(res.body.course).toHaveProperty('id', courseId);
      expect(res.body.course).toHaveProperty('title', 'Introduction to JavaScript');
    });
    
    it('should update course', async () => {
      const res = await request(app)
        .put(`/api/learning/courses/${courseId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'JavaScript Fundamentals',
          description: 'Updated description for JavaScript fundamentals course'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('course');
      expect(res.body.course).toHaveProperty('title', 'JavaScript Fundamentals');
    });
  });
  
  describe('Course Module API', () => {
    it('should create a new course module', async () => {
      const res = await request(app)
        .post('/api/learning/modules')
        .set('Authorization', `Bearer ${token}`)
        .send({
          course_id: courseId,
          title: 'Variables and Data Types',
          description: 'Learn about JavaScript variables and data types',
          order_number: 1,
          content_type: 'video',
          content_url: 'https://example.com/videos/js-variables.mp4',
          duration_minutes: 30,
          status: 'active'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('module');
      expect(res.body.module).toHaveProperty('course_id', courseId);
      expect(res.body.module).toHaveProperty('title', 'Variables and Data Types');
      
      // Store module ID for later tests
      moduleId = res.body.module.id;
    });
    
    it('should get modules for a course', async () => {
      const res = await request(app)
        .get(`/api/learning/modules/course/${courseId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('modules');
      expect(res.body.modules).toBeInstanceOf(Array);
      expect(res.body.modules.length).toBeGreaterThan(0);
    });
    
    it('should update course module', async () => {
      const res = await request(app)
        .put(`/api/learning/modules/${moduleId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'JavaScript Variables and Data Types',
          duration_minutes: 35
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('module');
      expect(res.body.module).toHaveProperty('title', 'JavaScript Variables and Data Types');
      expect(res.body.module).toHaveProperty('duration_minutes', 35);
    });
  });
  
  describe('Enrollment API', () => {
    it('should enroll an employee in a course', async () => {
      const res = await request(app)
        .post('/api/learning/enrollments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employee_id: employeeId,
          course_id: courseId,
          enrollment_date: new Date().toISOString(),
          status: 'enrolled',
          assigned_by: testData.userId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('enrollment');
      expect(res.body.enrollment).toHaveProperty('employee_id', employeeId);
      expect(res.body.enrollment).toHaveProperty('course_id', courseId);
      expect(res.body.enrollment).toHaveProperty('status', 'enrolled');
      
      // Store enrollment ID for later tests
      enrollmentId = res.body.enrollment.id;
    });
    
    it('should get enrollments for an employee', async () => {
      const res = await request(app)
        .get(`/api/learning/enrollments/employee/${employeeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('enrollments');
      expect(res.body.enrollments).toBeInstanceOf(Array);
      expect(res.body.enrollments.length).toBeGreaterThan(0);
    });
    
    it('should get enrollments for a course', async () => {
      const res = await request(app)
        .get(`/api/learning/enrollments/course/${courseId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('enrollments');
      expect(res.body.enrollments).toBeInstanceOf(Array);
      expect(res.body.enrollments.length).toBeGreaterThan(0);
    });
    
    it('should update module progress', async () => {
      const res = await request(app)
        .post('/api/learning/progress')
        .set('Authorization', `Bearer ${token}`)
        .send({
          enrollment_id: enrollmentId,
          module_id: moduleId,
          status: 'completed',
          completion_date: new Date().toISOString(),
          score: 95,
          time_spent_minutes: 28
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('progress');
      expect(res.body.progress).toHaveProperty('enrollment_id', enrollmentId);
      expect(res.body.progress).toHaveProperty('module_id', moduleId);
      expect(res.body.progress).toHaveProperty('status', 'completed');
    });
    
    it('should complete a course enrollment', async () => {
      const res = await request(app)
        .put(`/api/learning/enrollments/${enrollmentId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          completion_date: new Date().toISOString(),
          rating: 5,
          feedback: 'Excellent course, very informative'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('enrollment');
      expect(res.body.enrollment).toHaveProperty('id', enrollmentId);
      expect(res.body.enrollment).toHaveProperty('status', 'completed');
      expect(res.body.enrollment).toHaveProperty('rating', 5);
    });
  });
});
