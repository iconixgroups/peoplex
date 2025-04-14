// Analytics Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get HR overview dashboard data
 */
const getHrOverviewDashboard = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    // Start a transaction to ensure consistent data
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get employee count by status
      const employeeStatusResult = await client.query(
        `SELECT employment_status, COUNT(*) as count
        FROM hr.employees
        WHERE organization_id = $1
        GROUP BY employment_status`,
        [organizationId]
      );
      
      // Get employee count by department
      const departmentResult = await client.query(
        `SELECT d.name as department, COUNT(e.id) as count
        FROM hr.employees e
        JOIN core.departments d ON e.department_id = d.id
        WHERE e.organization_id = $1 AND e.employment_status = 'active'
        GROUP BY d.name
        ORDER BY count DESC`,
        [organizationId]
      );
      
      // Get employee count by location
      const locationResult = await client.query(
        `SELECT l.name as location, COUNT(e.id) as count
        FROM hr.employees e
        JOIN core.locations l ON e.location_id = l.id
        WHERE e.organization_id = $1 AND e.employment_status = 'active'
        GROUP BY l.name
        ORDER BY count DESC`,
        [organizationId]
      );
      
      // Get gender diversity
      const genderResult = await client.query(
        `SELECT gender, COUNT(*) as count
        FROM hr.employees
        WHERE organization_id = $1 AND employment_status = 'active'
        GROUP BY gender`,
        [organizationId]
      );
      
      // Get age distribution
      const ageResult = await client.query(
        `SELECT
          CASE
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) < 25 THEN 'Under 25'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 25 AND 34 THEN '25-34'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 35 AND 44 THEN '35-44'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 45 AND 54 THEN '45-54'
            ELSE '55 and above'
          END as age_group,
          COUNT(*) as count
        FROM hr.employees
        WHERE organization_id = $1 AND employment_status = 'active' AND date_of_birth IS NOT NULL
        GROUP BY age_group
        ORDER BY age_group`,
        [organizationId]
      );
      
      // Get tenure distribution
      const tenureResult = await client.query(
        `SELECT
          CASE
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) < 1 THEN 'Less than 1 year'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) BETWEEN 1 AND 2 THEN '1-2 years'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) BETWEEN 3 AND 5 THEN '3-5 years'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) BETWEEN 6 AND 10 THEN '6-10 years'
            ELSE 'More than 10 years'
          END as tenure_group,
          COUNT(*) as count
        FROM hr.employees
        WHERE organization_id = $1 AND employment_status = 'active'
        GROUP BY tenure_group
        ORDER BY tenure_group`,
        [organizationId]
      );
      
      // Get recent hires (last 30 days)
      const recentHiresResult = await client.query(
        `SELECT id, first_name, last_name, email, hire_date, job_title_id, department_id
        FROM hr.employees
        WHERE organization_id = $1 AND hire_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY hire_date DESC
        LIMIT 10`,
        [organizationId]
      );
      
      // Get upcoming work anniversaries (next 30 days)
      const anniversariesResult = await client.query(
        `SELECT id, first_name, last_name, email, hire_date, job_title_id, department_id,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) as years_of_service
        FROM hr.employees
        WHERE organization_id = $1 
        AND employment_status = 'active'
        AND TO_CHAR(hire_date, 'MM-DD') BETWEEN TO_CHAR(CURRENT_DATE, 'MM-DD') AND TO_CHAR(CURRENT_DATE + INTERVAL '30 days', 'MM-DD')
        ORDER BY TO_CHAR(hire_date, 'MM-DD')
        LIMIT 10`,
        [organizationId]
      );
      
      await client.query('COMMIT');
      
      const dashboardData = {
        employeeStatusDistribution: employeeStatusResult.rows,
        departmentDistribution: departmentResult.rows,
        locationDistribution: locationResult.rows,
        genderDiversity: genderResult.rows,
        ageDistribution: ageResult.rows,
        tenureDistribution: tenureResult.rows,
        recentHires: recentHiresResult.rows,
        upcomingAnniversaries: anniversariesResult.rows,
        totalEmployees: employeeStatusResult.rows.reduce((sum, item) => sum + parseInt(item.count), 0)
      };
      
      res.status(200).json({
        dashboardData
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get HR overview dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get recruitment analytics dashboard data
 */
const getRecruitmentDashboard = async (req, res) => {
  const { organizationId, period } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  // Default period is last 6 months
  const months = period ? parseInt(period) : 6;
  
  try {
    // Start a transaction to ensure consistent data
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get job posting statistics
      const jobPostingsResult = await client.query(
        `SELECT status, COUNT(*) as count
        FROM recruitment.job_postings
        WHERE organization_id = $1
        GROUP BY status`,
        [organizationId]
      );
      
      // Get applications by status
      const applicationsResult = await client.query(
        `SELECT status, COUNT(*) as count
        FROM recruitment.applications
        WHERE created_at >= CURRENT_DATE - INTERVAL '${months} months'
        AND job_posting_id IN (SELECT id FROM recruitment.job_postings WHERE organization_id = $1)
        GROUP BY status`,
        [organizationId]
      );
      
      // Get applications by source
      const applicationSourceResult = await client.query(
        `SELECT source, COUNT(*) as count
        FROM recruitment.applications
        WHERE created_at >= CURRENT_DATE - INTERVAL '${months} months'
        AND job_posting_id IN (SELECT id FROM recruitment.job_postings WHERE organization_id = $1)
        GROUP BY source`,
        [organizationId]
      );
      
      // Get applications by department
      const departmentApplicationsResult = await client.query(
        `SELECT d.name as department, COUNT(a.id) as count
        FROM recruitment.applications a
        JOIN recruitment.job_postings j ON a.job_posting_id = j.id
        JOIN core.departments d ON j.department_id = d.id
        WHERE a.created_at >= CURRENT_DATE - INTERVAL '${months} months'
        AND j.organization_id = $1
        GROUP BY d.name
        ORDER BY count DESC`,
        [organizationId]
      );
      
      // Get time-to-fill (average days from posting to hire)
      const timeToFillResult = await client.query(
        `SELECT d.name as department, 
        AVG(EXTRACT(DAY FROM (h.hire_date - j.posting_date))) as avg_days
        FROM recruitment.job_postings j
        JOIN core.departments d ON j.department_id = d.id
        JOIN recruitment.applications a ON a.job_posting_id = j.id
        JOIN hr.employees h ON a.candidate_id = h.candidate_id
        WHERE j.organization_id = $1
        AND j.status = 'closed'
        AND a.status = 'hired'
        AND j.posting_date >= CURRENT_DATE - INTERVAL '${months} months'
        GROUP BY d.name
        ORDER BY avg_days`,
        [organizationId]
      );
      
      // Get monthly application trends
      const monthlyTrendsResult = await client.query(
        `SELECT TO_CHAR(DATE_TRUNC('month', a.created_at), 'YYYY-MM') as month,
        COUNT(a.id) as applications,
        COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hires
        FROM recruitment.applications a
        JOIN recruitment.job_postings j ON a.job_posting_id = j.id
        WHERE j.organization_id = $1
        AND a.created_at >= CURRENT_DATE - INTERVAL '${months} months'
        GROUP BY month
        ORDER BY month`,
        [organizationId]
      );
      
      // Get top 5 job postings by application count
      const topJobsResult = await client.query(
        `SELECT j.id, j.title, j.department_id, d.name as department, 
        COUNT(a.id) as application_count
        FROM recruitment.job_postings j
        JOIN recruitment.applications a ON a.job_posting_id = j.id
        JOIN core.departments d ON j.department_id = d.id
        WHERE j.organization_id = $1
        AND j.posting_date >= CURRENT_DATE - INTERVAL '${months} months'
        GROUP BY j.id, j.title, j.department_id, d.name
        ORDER BY application_count DESC
        LIMIT 5`,
        [organizationId]
      );
      
      await client.query('COMMIT');
      
      const dashboardData = {
        jobPostingsByStatus: jobPostingsResult.rows,
        applicationsByStatus: applicationsResult.rows,
        applicationsBySource: applicationSourceResult.rows,
        applicationsByDepartment: departmentApplicationsResult.rows,
        timeToFillByDepartment: timeToFillResult.rows,
        monthlyApplicationTrends: monthlyTrendsResult.rows,
        topJobPostings: topJobsResult.rows,
        totalApplications: applicationsResult.rows.reduce((sum, item) => sum + parseInt(item.count), 0),
        totalHires: applicationsResult.rows.find(item => item.status === 'hired')?.count || 0
      };
      
      res.status(200).json({
        dashboardData
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get recruitment dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get performance analytics dashboard data
 */
const getPerformanceDashboard = async (req, res) => {
  const { organizationId, period } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    // Start a transaction to ensure consistent data
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get performance review statistics
      const reviewsResult = await client.query(
        `SELECT status, COUNT(*) as count
        FROM performance.performance_reviews
        WHERE organization_id = $1
        GROUP BY status`,
        [organizationId]
      );
      
      // Get performance rating distribution
      const ratingsResult = await client.query(
        `SELECT rating, COUNT(*) as count
        FROM performance.performance_reviews
        WHERE organization_id = $1 AND status = 'completed'
        GROUP BY rating
        ORDER BY rating`,
        [organizationId]
      );
      
      // Get average rating by department
      const departmentRatingsResult = await client.query(
        `SELECT d.name as department, AVG(pr.rating) as avg_rating
        FROM performance.performance_reviews pr
        JOIN hr.employees e ON pr.employee_id = e.id
        JOIN core.departments d ON e.department_id = d.id
        WHERE pr.organization_id = $1 AND pr.status = 'completed'
        GROUP BY d.name
        ORDER BY avg_rating DESC`,
        [organizationId]
      );
      
      // Get goal completion rate by department
      const goalCompletionResult = await client.query(
        `SELECT d.name as department, 
        COUNT(CASE WHEN g.status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as completion_rate
        FROM performance.goals g
        JOIN hr.employees e ON g.employee_id = e.id
        JOIN core.departments d ON e.department_id = d.id
        WHERE g.organization_id = $1
        GROUP BY d.name
        ORDER BY completion_rate DESC`,
        [organizationId]
      );
      
      // Get top performers (highest rated employees)
      const topPerformersResult = await client.query(
        `SELECT e.id, e.first_name, e.last_name, e.email, e.job_title_id, e.department_id,
        d.name as department, jt.title as job_title, pr.rating
        FROM performance.performance_reviews pr
        JOIN hr.employees e ON pr.employee_id = e.id
        JOIN core.departments d ON e.department_id = d.id
        JOIN core.job_titles jt ON e.job_title_id = jt.id
        WHERE pr.organization_id = $1 AND pr.status = 'completed'
        ORDER BY pr.rating DESC
        LIMIT 10`,
        [organizationId]
      );
      
      // Get performance improvement needs (lowest rated employees)
      const improvementNeedsResult = await client.query(
        `SELECT e.id, e.first_name, e.last_name, e.email, e.job_title_id, e.department_id,
        d.name as department, jt.title as job_title, pr.rating
        FROM performance.performance_reviews pr
        JOIN hr.employees e ON pr.employee_id = e.id
        JOIN core.departments d ON e.department_id = d.id
        JOIN core.job_titles jt ON e.job_title_id = jt.id
        WHERE pr.organization_id = $1 AND pr.status = 'completed'
        ORDER BY pr.rating ASC
        LIMIT 10`,
        [organizationId]
      );
      
      await client.query('COMMIT');
      
      const dashboardData = {
        reviewsByStatus: reviewsResult.rows,
        ratingDistribution: ratingsResult.rows,
        departmentAverageRatings: departmentRatingsResult.rows,
        goalCompletionRates: goalCompletionResult.rows,
        topPerformers: topPerformersResult.rows,
        improvementNeeds: improvementNeedsResult.rows,
        totalReviews: reviewsResult.rows.reduce((sum, item) => sum + parseInt(item.count), 0),
        completedReviews: reviewsResult.rows.find(item => item.status === 'completed')?.count || 0
      };
      
      res.status(200).json({
        dashboardData
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get performance dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get learning analytics dashboard data
 */
const getLearningDashboard = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    // Start a transaction to ensure consistent data
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get course statistics
      const coursesResult = await client.query(
        `SELECT status, COUNT(*) as count
        FROM learning.courses
        WHERE organization_id = $1
        GROUP BY status`,
        [organizationId]
      );
      
      // Get enrollment statistics
      const enrollmentsResult = await client.query(
        `SELECT en.status, COUNT(*) as count
        FROM learning.enrollments en
        JOIN learning.courses c ON en.course_id = c.id
        WHERE c.organization_id = $1
        GROUP BY en.status`,
        [organizationId]
      );
      
      // Get course categories distribution
      const categoriesResult = await client.query(
        `SELECT category, COUNT(*) as count
        FROM learning.courses
        WHERE organization_id = $1
        GROUP BY category
        ORDER BY count DESC`,
        [organizationId]
      );
      
      // Get completion rates by department
      const departmentCompletionResult = await client.query(
        `SELECT d.name as department, 
        COUNT(CASE WHEN en.status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as completion_rate
        FROM learning.enrollments en
        JOIN learning.courses c ON en.course_id = c.id
        JOIN hr.employees e ON en.employee_id = e.id
        JOIN core.departments d ON e.department_id = d.id
        WHERE c.organization_id = $1
        GROUP BY d.name
        ORDER BY completion_rate DESC`,
        [organizationId]
      );
      
      // Get popular courses
      const popularCoursesResult = await client.query(
        `SELECT c.id, c.title, c.category, c.format, c.credits,
        COUNT(en.id) as enrollment_count
        FROM learning.courses c
        LEFT JOIN learning.enrollments en ON c.id = en.course_id
        WHERE c.organization_id = $1
        GROUP BY c.id, c.title, c.category, c.format, c.credits
        ORDER BY enrollment_count DESC
        LIMIT 10`,
        [organizationId]
      );
      
      // Get average course ratings
      const ratingsResult = await client.query(
        `SELECT c.id, c.title, c.category,
        AVG(en.rating) as avg_rating,
        COUNT(en.rating) as rating_count
        FROM learning.courses c
        LEFT JOIN learning.enrollments en ON c.id = en.course_id
        WHERE c.organization_id = $1 AND en.rating IS NOT NULL
        GROUP BY c.id, c.title, c.category
        ORDER BY avg_rating DESC
        LIMIT 10`,
        [organizationId]
      );
      
      // Get employees with most completed courses
      const topLearnersResult = await client.query(
        `SELECT e.id, e.first_name, e.last_name, e.email, e.job_title_id, e.department_id,
        d.name as department, jt.title as job_title,
        COUNT(en.id) as completed_courses
        FROM learning.enrollments en
        JOIN hr.employees e ON en.employee_id = e.id
        JOIN core.departments d ON e.department_id = d.id
        JOIN core.job_titles jt ON e.job_title_id = jt.id
        WHERE en.status = 'completed'
        AND e.organization_id = $1
        GROUP BY e.id, e.first_name, e.last_name, e.email, e.job_title_id, e.department_id, d.name, jt.title
        ORDER BY completed_courses DESC
        LIMIT 10`,
        [organizationId]
      );
      
      await client.query('COMMIT');
      
      const dashboardData = {
        coursesByStatus: coursesResult.rows,
        enrollmentsByStatus: enrollmentsResult.rows,
        courseCategories: categoriesResult.rows,
        departmentCompletionRates: departmentCompletionResult.rows,
        popularCourses: popularCoursesResult.rows,
        topRatedCourses: ratingsResult.rows,
        topLearners: topLearnersResult.rows,
        totalCourses: coursesResult.rows.reduce((sum, item) => sum + parseInt(item.count), 0),
        totalEnrollments: enrollmentsResult.rows.reduce((sum, item) => sum + parseInt(item.count), 0)
      };
      
      res.status(200).json({
        dashboardData
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get learning dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get compensation analytics dashboard data
 */
const getCompensationDashboard = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    // Start a transaction to ensure consistent data
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get salary statistics by department
      const departmentSalaryResult = await client.query(
        `SELECT d.name as department, 
        MIN(es.salary_amount) as min_salary,
        MAX(es.salary_amount) as max_salary,
        AVG(es.salary_amount) as avg_salary
        FROM compensation.employee_salaries es
        JOIN hr.employees e ON es.employee_id = e.id
        JOIN core.departments d ON e.department_id = d.id
        WHERE e.organization_id = $1
        AND es.id IN (
          SELECT MAX(id) FROM compensation.employee_salaries 
          WHERE salary_type = 'base' 
          GROUP BY employee_id
        )
        GROUP BY d.name
        ORDER BY avg_salary DESC`,
        [organizationId]
      );
      
      // Get salary statistics by job title
      const jobTitleSalaryResult = await client.query(
        `SELECT jt.title as job_title, 
        MIN(es.salary_amount) as min_salary,
        MAX(es.salary_amount) as max_salary,
        AVG(es.salary_amount) as avg_salary,
        COUNT(*) as employee_count
        FROM compensation.employee_salaries es
        JOIN hr.employees e ON es.employee_id = e.id
        JOIN core.job_titles jt ON e.job_title_id = jt.id
        WHERE e.organization_id = $1
        AND es.id IN (
          SELECT MAX(id) FROM compensation.employee_salaries 
          WHERE salary_type = 'base' 
          GROUP BY employee_id
        )
        GROUP BY jt.title
        HAVING COUNT(*) >= 3  -- Only show titles with at least 3 employees for privacy
        ORDER BY avg_salary DESC`,
        [organizationId]
      );
      
      // Get salary range distribution
      const salaryRangeResult = await client.query(
        `SELECT
          CASE
            WHEN es.salary_amount < 30000 THEN 'Under $30K'
            WHEN es.salary_amount BETWEEN 30000 AND 49999 THEN '$30K-$50K'
            WHEN es.salary_amount BETWEEN 50000 AND 74999 THEN '$50K-$75K'
            WHEN es.salary_amount BETWEEN 75000 AND 99999 THEN '$75K-$100K'
            WHEN es.salary_amount BETWEEN 100000 AND 149999 THEN '$100K-$150K'
            ELSE 'Over $150K'
          END as salary_range,
          COUNT(*) as count
        FROM compensation.employee_salaries es
        JOIN hr.employees e ON es.employee_id = e.id
        WHERE e.organization_id = $1
        AND es.id IN (
          SELECT MAX(id) FROM compensation.employee_salaries 
          WHERE salary_type = 'base' 
          GROUP BY employee_id
        )
        GROUP BY salary_range
        ORDER BY 
          CASE
            WHEN salary_range = 'Under $30K' THEN 1
            WHEN salary_range = '$30K-$50K' THEN 2
            WHEN salary_range = '$50K-$75K' THEN 3
            WHEN salary_range = '$75K-$100K' THEN 4
            WHEN salary_range = '$100K-$150K' THEN 5
            ELSE 6
          END`,
        [organizationId]
      );
      
      // Get benefits enrollment statistics
      const benefitsResult = await client.query(
        `SELECT bp.name as benefit_plan, bp.benefit_type, COUNT(eb.id) as enrollment_count
        FROM compensation.employee_benefits eb
        JOIN compensation.benefit_plans bp ON eb.benefit_plan_id = bp.id
        JOIN hr.employees e ON eb.employee_id = e.id
        WHERE e.organization_id = $1 AND eb.status = 'active'
        GROUP BY bp.name, bp.benefit_type
        ORDER BY enrollment_count DESC`,
        [organizationId]
      );
      
      // Get gender pay gap analysis
      const genderPayGapResult = await client.query(
        `SELECT d.name as department, e.gender,
        AVG(es.salary_amount) as avg_salary,
        COUNT(*) as employee_count
        FROM compensation.employee_salaries es
        JOIN hr.employees e ON es.employee_id = e.id
        JOIN core.departments d ON e.department_id = d.id
        WHERE e.organization_id = $1
        AND e.gender IN ('male', 'female')
        AND es.id IN (
          SELECT MAX(id) FROM compensation.employee_salaries 
          WHERE salary_type = 'base' 
          GROUP BY employee_id
        )
        GROUP BY d.name, e.gender
        HAVING COUNT(*) >= 3  -- Only show groups with at least 3 employees for privacy
        ORDER BY d.name, e.gender`,
        [organizationId]
      );
      
      await client.query('COMMIT');
      
      // Process gender pay gap data to calculate the gap percentage
      const genderPayGapByDepartment = [];
      const departmentMap = new Map();
      
      genderPayGapResult.rows.forEach(row => {
        if (!departmentMap.has(row.department)) {
          departmentMap.set(row.department, {});
        }
        departmentMap.get(row.department)[row.gender] = parseFloat(row.avg_salary);
      });
      
      departmentMap.forEach((genderData, department) => {
        if (genderData.male && genderData.female) {
          const gapPercentage = ((genderData.male - genderData.female) / genderData.male) * 100;
          genderPayGapByDepartment.push({
            department,
            male_avg_salary: genderData.male,
            female_avg_salary: genderData.female,
            gap_percentage: gapPercentage.toFixed(2)
          });
        }
      });
      
      const dashboardData = {
        departmentSalaryStats: departmentSalaryResult.rows,
        jobTitleSalaryStats: jobTitleSalaryResult.rows,
        salaryRangeDistribution: salaryRangeResult.rows,
        benefitsEnrollment: benefitsResult.rows,
        genderPayGapByDepartment,
        organizationAvgSalary: departmentSalaryResult.rows.reduce((sum, item) => sum + parseFloat(item.avg_salary), 0) / departmentSalaryResult.rows.length
      };
      
      res.status(200).json({
        dashboardData
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get compensation dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getHrOverviewDashboard,
  getRecruitmentDashboard,
  getPerformanceDashboard,
  getLearningDashboard,
  getCompensationDashboard
};
