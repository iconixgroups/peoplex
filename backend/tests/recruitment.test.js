// Recruitment Module Tests for People X
const request = require('supertest');
const app = require('../src/app');
const { testPool, resetDatabase, generateTestToken } = require('./setup');

let testData;
let token;
let jobPostingId;
let candidateId;
let applicationId;

beforeAll(async () => {
  testData = await resetDatabase();
  token = generateTestToken(testData.userId, 'admin', testData.organizationId);
});

afterAll(async () => {
  await testPool.end();
});

describe('Recruitment API', () => {
  describe('Job Posting API', () => {
    it('should create a new job posting', async () => {
      const res = await request(app)
        .post('/api/recruitment/job-postings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Senior Developer',
          description: 'We are looking for a senior developer to join our team',
          requirements: 'At least 5 years of experience in web development',
          responsibilities: 'Lead development projects and mentor junior developers',
          department_id: 1, // Engineering department from setup
          location_id: 1, // Headquarters from setup
          job_type: 'full_time',
          salary_min: 100000,
          salary_max: 150000,
          status: 'open',
          posting_date: new Date().toISOString(),
          closing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('jobPosting');
      expect(res.body.jobPosting).toHaveProperty('title', 'Senior Developer');
      expect(res.body.jobPosting).toHaveProperty('status', 'open');
      
      // Store job posting ID for later tests
      jobPostingId = res.body.jobPosting.id;
    });
    
    it('should get all job postings', async () => {
      const res = await request(app)
        .get('/api/recruitment/job-postings')
        .query({ organizationId: testData.organizationId })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('jobPostings');
      expect(res.body.jobPostings).toBeInstanceOf(Array);
      expect(res.body.jobPostings.length).toBeGreaterThan(0);
    });
    
    it('should get job posting by ID', async () => {
      const res = await request(app)
        .get(`/api/recruitment/job-postings/${jobPostingId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('jobPosting');
      expect(res.body.jobPosting).toHaveProperty('id', jobPostingId);
      expect(res.body.jobPosting).toHaveProperty('title', 'Senior Developer');
    });
    
    it('should update job posting', async () => {
      const res = await request(app)
        .put(`/api/recruitment/job-postings/${jobPostingId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Senior Software Developer',
          requirements: 'At least 5 years of experience in web development with React and Node.js'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('jobPosting');
      expect(res.body.jobPosting).toHaveProperty('title', 'Senior Software Developer');
    });
  });
  
  describe('Candidate API', () => {
    it('should create a new candidate', async () => {
      const res = await request(app)
        .post('/api/recruitment/candidates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          phone: '555-987-6543',
          resume_url: 'https://example.com/resumes/jane-smith.pdf',
          linkedin_url: 'https://linkedin.com/in/janesmith',
          source: 'LinkedIn',
          status: 'active',
          organization_id: testData.organizationId
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('candidate');
      expect(res.body.candidate).toHaveProperty('first_name', 'Jane');
      expect(res.body.candidate).toHaveProperty('last_name', 'Smith');
      expect(res.body.candidate).toHaveProperty('email', 'jane.smith@example.com');
      
      // Store candidate ID for later tests
      candidateId = res.body.candidate.id;
    });
    
    it('should get all candidates', async () => {
      const res = await request(app)
        .get('/api/recruitment/candidates')
        .query({ organizationId: testData.organizationId })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('candidates');
      expect(res.body.candidates).toBeInstanceOf(Array);
      expect(res.body.candidates.length).toBeGreaterThan(0);
    });
    
    it('should get candidate by ID', async () => {
      const res = await request(app)
        .get(`/api/recruitment/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('candidate');
      expect(res.body.candidate).toHaveProperty('id', candidateId);
      expect(res.body.candidate).toHaveProperty('first_name', 'Jane');
      expect(res.body.candidate).toHaveProperty('last_name', 'Smith');
    });
    
    it('should update candidate', async () => {
      const res = await request(app)
        .put(`/api/recruitment/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          phone: '555-111-2222',
          skills: 'JavaScript, React, Node.js',
          notes: 'Strong frontend developer'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('candidate');
      expect(res.body.candidate).toHaveProperty('phone', '555-111-2222');
      expect(res.body.candidate).toHaveProperty('skills', 'JavaScript, React, Node.js');
    });
  });
  
  describe('Application API', () => {
    it('should create a new application', async () => {
      const res = await request(app)
        .post('/api/recruitment/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          job_posting_id: jobPostingId,
          candidate_id: candidateId,
          application_date: new Date().toISOString(),
          cover_letter: 'I am excited to apply for this position...',
          status: 'applied',
          source: 'Company Website'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('application');
      expect(res.body.application).toHaveProperty('job_posting_id', jobPostingId);
      expect(res.body.application).toHaveProperty('candidate_id', candidateId);
      expect(res.body.application).toHaveProperty('status', 'applied');
      
      // Store application ID for later tests
      applicationId = res.body.application.id;
    });
    
    it('should get applications for a job posting', async () => {
      const res = await request(app)
        .get(`/api/recruitment/applications/job/${jobPostingId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('applications');
      expect(res.body.applications).toBeInstanceOf(Array);
      expect(res.body.applications.length).toBeGreaterThan(0);
    });
    
    it('should get applications for a candidate', async () => {
      const res = await request(app)
        .get(`/api/recruitment/applications/candidate/${candidateId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('applications');
      expect(res.body.applications).toBeInstanceOf(Array);
      expect(res.body.applications.length).toBeGreaterThan(0);
    });
    
    it('should update application status', async () => {
      const res = await request(app)
        .put(`/api/recruitment/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'screening',
          notes: 'Moving to initial screening phase'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('application');
      expect(res.body.application).toHaveProperty('id', applicationId);
      expect(res.body.application).toHaveProperty('status', 'screening');
    });
  });
  
  describe('Interview API', () => {
    let interviewId;
    
    it('should schedule an interview', async () => {
      const res = await request(app)
        .post('/api/recruitment/interviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          application_id: applicationId,
          interview_type: 'technical',
          scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          duration_minutes: 60,
          location: 'Conference Room A',
          interviewer_ids: [testData.userId],
          status: 'scheduled',
          notes: 'Technical assessment interview'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('interview');
      expect(res.body.interview).toHaveProperty('application_id', applicationId);
      expect(res.body.interview).toHaveProperty('interview_type', 'technical');
      expect(res.body.interview).toHaveProperty('status', 'scheduled');
      
      // Store interview ID for later tests
      interviewId = res.body.interview.id;
    });
    
    it('should get interviews for an application', async () => {
      const res = await request(app)
        .get(`/api/recruitment/interviews/application/${applicationId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('interviews');
      expect(res.body.interviews).toBeInstanceOf(Array);
      expect(res.body.interviews.length).toBeGreaterThan(0);
    });
    
    it('should update interview feedback', async () => {
      const res = await request(app)
        .put(`/api/recruitment/interviews/${interviewId}/feedback`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'completed',
          feedback: 'Candidate demonstrated strong technical skills',
          rating: 4,
          recommendation: 'proceed',
          interviewer_id: testData.userId
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('interview');
      expect(res.body.interview).toHaveProperty('id', interviewId);
      expect(res.body.interview).toHaveProperty('status', 'completed');
      expect(res.body.interview).toHaveProperty('rating', 4);
    });
  });
});
