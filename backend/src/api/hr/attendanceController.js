// Attendance Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get attendance records for an employee
 */
const getEmployeeAttendance = async (req, res) => {
  const { employee_id } = req.params;
  const { start_date, end_date } = req.query;
  
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
      SELECT id, date, check_in, check_out, status, work_hours, location, ip_address, notes
      FROM hr.attendance_records
      WHERE employee_id = $1
    `;
    
    const queryParams = [employee_id];
    let paramIndex = 2;
    
    if (start_date) {
      query += ` AND date >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      query += ` AND date <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }
    
    query += ` ORDER BY date DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      attendance: result.rows
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get attendance records for all employees in an organization
 */
const getOrganizationAttendance = async (req, res) => {
  const { organization_id, department_id, date } = req.query;
  
  if (!organization_id) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }
  
  try {
    let query = `
      SELECT a.id, a.employee_id, a.date, a.check_in, a.check_out, a.status, a.work_hours, a.location,
      e.first_name, e.last_name, e.employee_id as emp_code,
      d.name as department_name
      FROM hr.attendance_records a
      JOIN hr.employees e ON a.employee_id = e.id
      LEFT JOIN core.departments d ON e.department_id = d.id
      WHERE e.organization_id = $1 AND a.date = $2
    `;
    
    const queryParams = [organization_id, date];
    let paramIndex = 3;
    
    if (department_id) {
      query += ` AND e.department_id = $${paramIndex}`;
      queryParams.push(department_id);
      paramIndex++;
    }
    
    query += ` ORDER BY e.first_name, e.last_name`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      attendance: result.rows
    });
  } catch (error) {
    console.error('Get organization attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Record check-in
 */
const checkIn = async (req, res) => {
  const { employee_id } = req.params;
  const { location, ip_address, device_info } = req.body;
  
  try {
    // Check if employee exists
    const empCheck = await pgPool.query(
      'SELECT id FROM hr.employees WHERE id = $1',
      [employee_id]
    );
    
    if (empCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const checkResult = await pgPool.query(
      'SELECT id, check_in FROM hr.attendance_records WHERE employee_id = $1 AND date = $2',
      [employee_id, today]
    );
    
    if (checkResult.rows.length > 0 && checkResult.rows[0].check_in) {
      return res.status(400).json({ error: 'Already checked in today' });
    }
    
    let result;
    const now = new Date();
    
    if (checkResult.rows.length > 0) {
      // Update existing record
      result = await pgPool.query(
        `UPDATE hr.attendance_records 
        SET check_in = $1, 
            status = 'present',
            location = $2,
            ip_address = $3,
            device_info = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, date, check_in, status`,
        [now, location, ip_address, device_info, checkResult.rows[0].id]
      );
    } else {
      // Create new record
      result = await pgPool.query(
        `INSERT INTO hr.attendance_records 
        (employee_id, date, check_in, status, location, ip_address, device_info, created_at, updated_at) 
        VALUES ($1, $2, $3, 'present', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING id, date, check_in, status`,
        [employee_id, today, now, location, ip_address, device_info]
      );
    }
    
    res.status(200).json({
      message: 'Check-in recorded successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Record check-out
 */
const checkOut = async (req, res) => {
  const { employee_id } = req.params;
  const { notes } = req.body;
  
  try {
    // Check if employee exists
    const empCheck = await pgPool.query(
      'SELECT id FROM hr.employees WHERE id = $1',
      [employee_id]
    );
    
    if (empCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Check if checked in today
    const today = new Date().toISOString().split('T')[0];
    const checkResult = await pgPool.query(
      'SELECT id, check_in, check_out FROM hr.attendance_records WHERE employee_id = $1 AND date = $2',
      [employee_id, today]
    );
    
    if (checkResult.rows.length === 0 || !checkResult.rows[0].check_in) {
      return res.status(400).json({ error: 'Not checked in today' });
    }
    
    if (checkResult.rows[0].check_out) {
      return res.status(400).json({ error: 'Already checked out today' });
    }
    
    const now = new Date();
    const checkIn = new Date(checkResult.rows[0].check_in);
    
    // Calculate work hours
    const diffMs = now - checkIn;
    const diffHrs = diffMs / (1000 * 60 * 60);
    const workHours = Math.round(diffHrs * 100) / 100; // Round to 2 decimal places
    
    const result = await pgPool.query(
      `UPDATE hr.attendance_records 
      SET check_out = $1, 
          work_hours = $2,
          notes = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, date, check_in, check_out, work_hours, status`,
      [now, workHours, notes, checkResult.rows[0].id]
    );
    
    res.status(200).json({
      message: 'Check-out recorded successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update attendance record
 */
const updateAttendance = async (req, res) => {
  const { id } = req.params;
  const { check_in, check_out, status, work_hours, notes } = req.body;
  
  try {
    // Check if record exists
    const recordCheck = await pgPool.query(
      'SELECT id FROM hr.attendance_records WHERE id = $1',
      [id]
    );
    
    if (recordCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    // Calculate work hours if check_in and check_out are provided
    let calculatedWorkHours = work_hours;
    if (check_in && check_out) {
      const checkInTime = new Date(check_in);
      const checkOutTime = new Date(check_out);
      const diffMs = checkOutTime - checkInTime;
      const diffHrs = diffMs / (1000 * 60 * 60);
      calculatedWorkHours = Math.round(diffHrs * 100) / 100; // Round to 2 decimal places
    }
    
    const result = await pgPool.query(
      `UPDATE hr.attendance_records 
      SET check_in = COALESCE($1, check_in), 
          check_out = $2, 
          status = COALESCE($3, status), 
          work_hours = COALESCE($4, work_hours),
          notes = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, date, check_in, check_out, status, work_hours, notes`,
      [check_in, check_out, status, calculatedWorkHours, notes, id]
    );
    
    res.status(200).json({
      message: 'Attendance record updated successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getEmployeeAttendance,
  getOrganizationAttendance,
  checkIn,
  checkOut,
  updateAttendance
};
