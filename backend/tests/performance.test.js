// Performance Module Tests for People X
const request = require('supertest');
const app = require('../src/app');
const { testPool, resetDatabase, generateTestToken } = require('./setup');

let testData;
let token;
let employeeId;
let templateId;
let reviewId;
let goalId;

beforeAll(async () => {
  testData = await resetDatabase();
  token = generateTestToken(testData.userId, 'admin', testData.organizationId);
  
  // Create a test employee for performance tests
  const employeeRes = await request(app)
    .post('/api/hr/employees')
    .set('Authorization', `Bearer ${token}`)
    .send({
      first_name: 'Performance',
      last_name: 'Tester',
      email: 'performance.tester@test.com',
      phone: '555-123-7890',
      hire_date: '2023-01-15',
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

describe('Performance API', () => {
  describe('Review Template API', () => {
    it('should create a new review template', async () => {
      const res = await request(app)
        .post('/api/performance/review-templates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Annual Performance Review',
          description: 'Standard annual performance evaluation',
          sections: JSON.stringify([
            {
              title: 'Goals Achievement',
              weight: 30,
              questions: [
                { text: 'How well did the employee achieve their goals?', type: 'rating', required: true },
                { text: 'Provide examples of goals achieved or missed', type: 'text', required: true }
              ]
            },
            {
              title: 'Core Competencies',
              weight: 40,
              questions: [
                { text: 'Communication skills', type: 'rating', required: true },
                { text: 'Teamwork', type: 'rating', required: true },
                { text: 'Problem solving', type: 'rating', required: true }
              ]
            },
            {
              title: 'Overall Performance',
              weight: 30,
              questions: [
                { text: 'Overall performance rating', type: 'rating', required: true },
                { text: 'Areas of strength', type: 'text', required: true },
                { text: 'Areas for improvement', type: 'text', required: true }
              ]
            }
          ]),
          status: 'active',
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('template');
      expect(res.body.template).toHaveProperty('title', 'Annual Performance Review');
      expect(res.body.template).toHaveProperty('status', 'active');
      
      // Store template ID for later tests
      templateId = res.body.template.id;
    });
    
    it('should get all review templates', async () => {
      const res = await request(app)
        .get('/api/performance/review-templates')
        .query({ organizationId: testData.organizationId })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('templates');
      expect(res.body.templates).toBeInstanceOf(Array);
      expect(res.body.templates.length).toBeGreaterThan(0);
    });
    
    it('should get review template by ID', async () => {
      const res = await request(app)
        .get(`/api/performance/review-templates/${templateId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('template');
      expect(res.body.template).toHaveProperty('id', templateId);
      expect(res.body.template).toHaveProperty('title', 'Annual Performance Review');
    });
    
    it('should update review template', async () => {
      const res = await request(app)
        .put(`/api/performance/review-templates/${templateId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Annual Review',
          description: 'Updated description for annual performance evaluation'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('template');
      expect(res.body.template).toHaveProperty('title', 'Updated Annual Review');
    });
  });
  
  describe('Performance Review API', () => {
    it('should create a new performance review', async () => {
      const res = await request(app)
        .post('/api/performance/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employee_id: employeeId,
          reviewer_id: testData.userId,
          template_id: templateId,
          review_period: '2023 Q1',
          start_date: '2023-01-01',
          end_date: '2023-03-31',
          due_date: '2023-04-15',
          status: 'in_progress',
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('review');
      expect(res.body.review).toHaveProperty('employee_id', employeeId);
      expect(res.body.review).toHaveProperty('template_id', templateId);
      expect(res.body.review).toHaveProperty('status', 'in_progress');
      
      // Store review ID for later tests
      reviewId = res.body.review.id;
    });
    
    it('should get reviews for an employee', async () => {
      const res = await request(app)
        .get(`/api/performance/reviews/employee/${employeeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('reviews');
      expect(res.body.reviews).toBeInstanceOf(Array);
      expect(res.body.reviews.length).toBeGreaterThan(0);
    });
    
    it('should submit review responses', async () => {
      const res = await request(app)
        .put(`/api/performance/reviews/${reviewId}/responses`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          responses: JSON.stringify({
            'Goals Achievement': {
              'How well did the employee achieve their goals?': 4,
              'Provide examples of goals achieved or missed': 'Employee exceeded sales targets by 15%'
            },
            'Core Competencies': {
              'Communication skills': 4,
              'Teamwork': 5,
              'Problem solving': 4
            },
            'Overall Performance': {
              'Overall performance rating': 4,
              'Areas of strength': 'Excellent team collaboration and customer service',
              'Areas for improvement': 'Could improve documentation practices'
            }
          }),
          comments: 'Overall excellent performance this quarter'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('review');
      expect(res.body.review).toHaveProperty('id', reviewId);
      expect(res.body.review).toHaveProperty('responses');
    });
    
    it('should complete a review', async () => {
      const res = await request(app)
        .put(`/api/performance/reviews/${reviewId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 4,
          summary: 'Excellent performance with minor areas for improvement',
          completed_by: testData.userId
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('review');
      expect(res.body.review).toHaveProperty('id', reviewId);
      expect(res.body.review).toHaveProperty('status', 'completed');
      expect(res.body.review).toHaveProperty('rating', 4);
    });
  });
  
  describe('Goals API', () => {
    it('should create a new goal', async () => {
      const res = await request(app)
        .post('/api/performance/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          employee_id: employeeId,
          title: 'Increase sales by 20%',
          description: 'Work to increase quarterly sales by at least 20% compared to previous quarter',
          category: 'Business',
          priority: 'high',
          start_date: '2023-04-01',
          due_date: '2023-06-30',
          status: 'in_progress',
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('goal');
      expect(res.body.goal).toHaveProperty('employee_id', employeeId);
      expect(res.body.goal).toHaveProperty('title', 'Increase sales by 20%');
      expect(res.body.goal).toHaveProperty('status', 'in_progress');
      
      // Store goal ID for later tests
      goalId = res.body.goal.id;
    });
    
    it('should get goals for an employee', async () => {
      const res = await request(app)
        .get(`/api/performance/goals/employee/${employeeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('goals');
      expect(res.body.goals).toBeInstanceOf(Array);
      expect(res.body.goals.length).toBeGreaterThan(0);
    });
    
    it('should update goal progress', async () => {
      const res = await request(app)
        .put(`/api/performance/goals/${goalId}/progress`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          progress: 50,
          progress_notes: 'Sales have increased by 10% so far'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('goal');
      expect(res.body.goal).toHaveProperty('id', goalId);
      expect(res.body.goal).toHaveProperty('progress', 50);
    });
    
    it('should complete a goal', async () => {
      const res = await request(app)
        .put(`/api/performance/goals/${goalId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          actual_result: 'Increased sales by 22%',
          completion_notes: 'Exceeded target by implementing new sales strategies'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('goal');
      expect(res.body.goal).toHaveProperty('id', goalId);
      expect(res.body.goal).toHaveProperty('status', 'completed');
      expect(res.body.goal).toHaveProperty('progress', 100);
    });
  });
});
