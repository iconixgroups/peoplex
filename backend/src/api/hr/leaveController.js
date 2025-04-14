// Leave Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get leave types for an organization
 */
const getLeaveTypes = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT id, name, description, color_code, is_paid, requires_approval, created_at, updated_at
      FROM hr.leave_types
      WHERE organization_id = $1
      ORDER BY name`,
      [organizationId]
    );
    
    res.status(200).json({
      leaveTypes: result.rows
    });
  } catch (error) {
    console.error('Get leave types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create leave type
 */
const createLeaveType = async (req, res) => {
  const { organization_id, name, description, color_code, is_paid, requires_approval } = req.body;
  
  if (!organization_id || !name) {
    return res.status(400).json({ error: 'Organization ID and name are required' });
  }
  
  try {
    // Check if leave type with same name already exists in the organization
    const typeCheck = await pgPool.query(
      'SELECT id FROM hr.leave_types WHERE name = $1 AND organization_id = $2',
      [name, organization_id]
    );
    
    if (typeCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Leave type already exists in the organization' });
    }
    
    const result = await pgPool.query(
      `INSERT INTO hr.leave_types 
      (organization_id, name, description, color_code, is_paid, requires_approval, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, description, color_code, is_paid, requires_approval, created_at`,
      [organization_id, name, description, color_code, is_paid, requires_approval]
    );
    
    res.status(201).json({
      message: 'Leave type created successfully',
      leaveType: result.rows[0]
    });
  } catch (error) {
    console.error('Create leave type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get leave balances for an employee
 */
const getEmployeeLeaveBalances = async (req, res) => {
  const { employee_id } = req.params;
  const { year } = req.query;
  
  const currentYear = new Date().getFullYear();
  const targetYear = year || currentYear;
  
  try {
    // Check if employee exists
    const empCheck = await pgPool.query(
      'SELECT id FROM hr.employees WHERE id = $1',
      [employee_id]
    );
    
    if (empCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const result = await pgPool.query(
      `SELECT b.id, b.leave_type_id, t.name as leave_type, t.color_code, t.is_paid,
      b.year, b.entitled_days, b.carried_over_days, b.accrued_days, 
      b.used_days, b.pending_days, b.remaining_days
      FROM hr.employee_leave_balances b
      JOIN hr.leave_types t ON b.leave_type_id = t.id
      WHERE b.employee_id = $1 AND b.year = $2
      ORDER BY t.name`,
      [employee_id, targetYear]
    );
    
    res.status(200).json({
      leaveBalances: result.rows
    });
  } catch (error) {
    console.error('Get leave balances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get leave requests for an employee
 */
const getEmployeeLeaveRequests = async (req, res) => {
  const { employee_id } = req.params;
  const { status, year } = req.query;
  
  try {
    // Check if employee exists
    const empCheck = await pgPool.query(
      'SELECT id FROM hr.employees WHERE id = $1',
      [employee_id]
    );
    
    if (empCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    let query = `
      SELECT r.id, r.leave_type_id, t.name as leave_type, t.color_code,
      r.start_date, r.end_date, r.half_day, r.half_day_part, r.days,
      r.reason, r.status, r.approver_id, 
      CONCAT(e.first_name, ' ', e.last_name) as approver_name,
      r.approval_date, r.rejection_reason, r.created_at
      FROM hr.leave_requests r
      JOIN hr.leave_types t ON r.leave_type_id = t.id
      LEFT JOIN hr.employees e ON r.approver_id = e.id
      WHERE r.employee_id = $1
    `;
    
    const queryParams = [employee_id];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    if (year) {
      query += ` AND EXTRACT(YEAR FROM r.start_date) = $${paramIndex}`;
      queryParams.push(year);
      paramIndex++;
    }
    
    query += ` ORDER BY r.start_date DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      leaveRequests: result.rows
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get leave requests for approval
 */
const getLeaveRequestsForApproval = async (req, res) => {
  const { organization_id, department_id } = req.query;
  
  if (!organization_id) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    let query = `
      SELECT r.id, r.employee_id, 
      CONCAT(e.first_name, ' ', e.last_name) as employee_name,
      e.employee_id as employee_code, d.name as department,
      r.leave_type_id, t.name as leave_type, t.color_code,
      r.start_date, r.end_date, r.half_day, r.half_day_part, r.days,
      r.reason, r.status, r.created_at
      FROM hr.leave_requests r
      JOIN hr.employees e ON r.employee_id = e.id
      JOIN hr.leave_types t ON r.leave_type_id = t.id
      LEFT JOIN core.departments d ON e.department_id = d.id
      WHERE e.organization_id = $1 AND r.status = 'pending'
    `;
    
    const queryParams = [organization_id];
    let paramIndex = 2;
    
    if (department_id) {
      query += ` AND e.department_id = $${paramIndex}`;
      queryParams.push(department_id);
      paramIndex++;
    }
    
    query += ` ORDER BY r.created_at`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      leaveRequests: result.rows
    });
  } catch (error) {
    console.error('Get leave requests for approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create leave request
 */
const createLeaveRequest = async (req, res) => {
  const { employee_id, leave_type_id, start_date, end_date, half_day, half_day_part, reason } = req.body;
  
  if (!employee_id || !leave_type_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'Employee ID, leave type, start date, and end date are required' });
  }
  
  // Start a transaction
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if employee exists
    const empCheck = await client.query(
      'SELECT id, organization_id FROM hr.employees WHERE id = $1',
      [employee_id]
    );
    
    if (empCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check if leave type exists and belongs to the employee's organization
    const typeCheck = await client.query(
      'SELECT id, requires_approval FROM hr.leave_types WHERE id = $1 AND organization_id = $2',
      [leave_type_id, empCheck.rows[0].organization_id]
    );
    
    if (typeCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave type not found' });
    }
    
    // Calculate number of days
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate > endDate) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Start date cannot be after end date' });
    }
    
    let days = 0;
    
    if (half_day) {
      days = 0.5;
    } else {
      // Calculate business days between start and end dates
      const dayMilliseconds = 24 * 60 * 60 * 1000;
      let tempDate = new Date(startDate.getTime());
      
      while (tempDate <= endDate) {
        const day = tempDate.getDay();
        if (day !== 0 && day !== 6) {
          days++;
        }
        tempDate = new Date(tempDate.getTime() + dayMilliseconds);
      }
    }
    
    // Check if there's enough leave balance
    const year = startDate.getFullYear();
    const balanceCheck = await client.query(
      'SELECT remaining_days FROM hr.employee_leave_balances WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3',
      [employee_id, leave_type_id, year]
    );
    
    if (balanceCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No leave balance found for this leave type' });
    }
    
    if (balanceCheck.rows[0].remaining_days < days) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient leave balance' });
    }
    
    // Check for overlapping leave requests
    const overlapCheck = await client.query(
      `SELECT id FROM hr.leave_requests 
      WHERE employee_id = $1 
      AND status IN ('pending', 'approved') 
      AND (
        (start_date <= $2 AND end_date >= $2) OR
        (start_date <= $3 AND end_date >= $3) OR
        (start_date >= $2 AND end_date <= $3)
      )`,
      [employee_id, start_date, end_date]
    );
    
    if (overlapCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Leave request overlaps with existing request' });
    }
    
    // Determine initial status based on whether approval is required
    const status = typeCheck.rows[0].requires_approval ? 'pending' : 'approved';
    
    // Create leave request
    const result = await client.query(
      `INSERT INTO hr.leave_requests 
      (employee_id, leave_type_id, start_date, end_date, half_day, half_day_part, days, reason, status, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, leave_type_id, start_date, end_date, days, status, created_at`,
      [employee_id, leave_type_id, start_date, end_date, half_day, half_day_part, days, reason, status]
    );
    
    // Update leave balance
    if (status === 'approved') {
      await client.query(
        `UPDATE hr.employee_leave_balances 
        SET used_days = used_days + $1, 
            remaining_days = remaining_days - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [days, employee_id, leave_type_id, year]
      );
    } else {
      await client.query(
        `UPDATE hr.employee_leave_balances 
        SET pending_days = pending_days + $1, 
            remaining_days = remaining_days - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [days, employee_id, leave_type_id, year]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Leave request created successfully',
      leaveRequest: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

/**
 * Approve or reject leave request
 */
const processLeaveRequest = async (req, res) => {
  const { id } = req.params;
  const { action, rejection_reason } = req.body;
  
  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be either approve or reject' });
  }
  
  if (action === 'reject' && !rejection_reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }
  
  // Start a transaction
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get leave request details
    const requestCheck = await client.query(
      `SELECT r.id, r.employee_id, r.leave_type_id, r.days, r.status, 
      EXTRACT(YEAR FROM r.start_date) as year
      FROM hr.leave_requests r
      WHERE r.id = $1`,
      [id]
    );
    
    if (requestCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    const request = requestCheck.rows[0];
    
    if (request.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Leave request is not in pending status' });
    }
    
    if (action === 'approve') {
      // Update leave request
      await client.query(
        `UPDATE hr.leave_requests 
        SET status = 'approved', 
            approver_id = $1, 
            approval_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2`,
        [req.user.id, id]
      );
      
      // Update leave balance
      await client.query(
        `UPDATE hr.employee_leave_balances 
        SET pending_days = pending_days - $1, 
            used_days = used_days + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [request.days, request.employee_id, request.leave_type_id, request.year]
      );
      
      await client.query('COMMIT');
      
      res.status(200).json({
        message: 'Leave request approved successfully'
      });
    } else {
      // Update leave request
      await client.query(
        `UPDATE hr.leave_requests 
        SET status = 'rejected', 
            approver_id = $1, 
            approval_date = CURRENT_TIMESTAMP,
            rejection_reason = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3`,
        [req.user.id, rejection_reason, id]
      );
      
      // Update leave balance
      await client.query(
        `UPDATE hr.employee_leave_balances 
        SET pending_days = pending_days - $1, 
            remaining_days = remaining_days + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [request.days, request.employee_id, request.leave_type_id, request.year]
      );
      
      await client.query('COMMIT');
      
      res.status(200).json({
        message: 'Leave request rejected successfully'
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Process leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

/**
 * Cancel leave request
 */
const cancelLeaveRequest = async (req, res) => {
  const { id } = req.params;
  
  // Start a transaction
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get leave request details
    const requestCheck = await client.query(
      `SELECT r.id, r.employee_id, r.leave_type_id, r.days, r.status, 
      EXTRACT(YEAR FROM r.start_date) as year
      FROM hr.leave_requests r
      WHERE r.id = $1`,
      [id]
    );
    
    if (requestCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    const request = requestCheck.rows[0];
    
    // Check if user is the employee or has admin/HR role
    if (req.user.id !== request.employee_id && !req.user.roles.some(role => ['admin', 'hr_manager'].includes(role))) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized to cancel this leave request' });
    }
    
    if (!['pending', 'approved'].includes(request.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Leave request cannot be cancelled' });
    }
    
    // Update leave request
    await client.query(
      `UPDATE hr.leave_requests 
      SET status = 'cancelled', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [id]
    );
    
    // Update leave balance
    if (request.status === 'pending') {
      await client.query(
        `UPDATE hr.employee_leave_balances 
        SET pending_days = pending_days - $1, 
            remaining_days = remaining_days + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [request.days, request.employee_id, request.leave_type_id, request.year]
      );
    } else {
      await client.query(
        `UPDATE hr.employee_leave_balances 
        SET used_days = used_days - $1, 
            remaining_days = remaining_days + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [request.days, request.employee_id, request.leave_type_id, request.year]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Leave request cancelled successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

module.exports = {
  getLeaveTypes,
  createLeaveType,
  getEmployeeLeaveBalances,
  getEmployeeLeaveRequests,
  getLeaveRequestsForApproval,
  createLeaveRequest,
  processLeaveRequest,
  cancelLeaveRequest
};
