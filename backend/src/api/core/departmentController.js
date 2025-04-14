// Department Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all departments for an organization
 */
const getDepartments = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT d.id, d.name, d.code, d.parent_id, 
      p.name as parent_name, d.head_employee_id, 
      CONCAT(e.first_name, ' ', e.last_name) as head_name,
      d.created_at, d.updated_at
      FROM core.departments d
      LEFT JOIN core.departments p ON d.parent_id = p.id
      LEFT JOIN hr.employees e ON d.head_employee_id = e.id
      WHERE d.organization_id = $1
      ORDER BY d.name`,
      [organizationId]
    );
    
    res.status(200).json({
      departments: result.rows
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get department by ID
 */
const getDepartmentById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT d.id, d.organization_id, d.name, d.code, d.parent_id, 
      p.name as parent_name, d.head_employee_id, 
      CONCAT(e.first_name, ' ', e.last_name) as head_name,
      d.created_at, d.updated_at
      FROM core.departments d
      LEFT JOIN core.departments p ON d.parent_id = p.id
      LEFT JOIN hr.employees e ON d.head_employee_id = e.id
      WHERE d.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Get employees in this department
    const employeesResult = await pgPool.query(
      `SELECT id, employee_id, first_name, last_name, job_title_id, 
      (SELECT title FROM core.job_titles WHERE id = job_title_id) as job_title
      FROM hr.employees
      WHERE department_id = $1
      ORDER BY first_name, last_name`,
      [id]
    );
    
    // Get child departments
    const childrenResult = await pgPool.query(
      `SELECT id, name, code
      FROM core.departments
      WHERE parent_id = $1
      ORDER BY name`,
      [id]
    );
    
    const department = {
      ...result.rows[0],
      employees: employeesResult.rows,
      children: childrenResult.rows
    };
    
    res.status(200).json({
      department
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new department
 */
const createDepartment = async (req, res) => {
  const { organization_id, name, code, parent_id, head_employee_id } = req.body;
  
  if (!organization_id || !name) {
    return res.status(400).json({ error: 'Organization ID and name are required' });
  }
  
  try {
    // Check if department with same code already exists in the organization
    if (code) {
      const codeCheck = await pgPool.query(
        'SELECT id FROM core.departments WHERE code = $1 AND organization_id = $2',
        [code, organization_id]
      );
      
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Department with this code already exists in the organization' });
      }
    }
    
    // Check if parent department exists and belongs to the same organization
    if (parent_id) {
      const parentCheck = await pgPool.query(
        'SELECT organization_id FROM core.departments WHERE id = $1',
        [parent_id]
      );
      
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Parent department not found' });
      }
      
      if (parentCheck.rows[0].organization_id !== parseInt(organization_id)) {
        return res.status(400).json({ error: 'Parent department belongs to a different organization' });
      }
    }
    
    // Check if head employee exists and belongs to the same organization
    if (head_employee_id) {
      const headCheck = await pgPool.query(
        'SELECT organization_id FROM hr.employees WHERE id = $1',
        [head_employee_id]
      );
      
      if (headCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Head employee not found' });
      }
      
      if (headCheck.rows[0].organization_id !== parseInt(organization_id)) {
        return res.status(400).json({ error: 'Head employee belongs to a different organization' });
      }
    }
    
    const result = await pgPool.query(
      `INSERT INTO core.departments 
      (organization_id, name, code, parent_id, head_employee_id, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, organization_id, name, code, parent_id, head_employee_id, created_at`,
      [organization_id, name, code, parent_id, head_employee_id]
    );
    
    res.status(201).json({
      message: 'Department created successfully',
      department: result.rows[0]
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update department
 */
const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, code, parent_id, head_employee_id } = req.body;
  
  try {
    // Check if department exists
    const deptCheck = await pgPool.query(
      'SELECT id, organization_id FROM core.departments WHERE id = $1',
      [id]
    );
    
    if (deptCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    const organization_id = deptCheck.rows[0].organization_id;
    
    // Check if code is unique within the organization if provided
    if (code) {
      const codeCheck = await pgPool.query(
        'SELECT id FROM core.departments WHERE code = $1 AND organization_id = $2 AND id != $3',
        [code, organization_id, id]
      );
      
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Department with this code already exists in the organization' });
      }
    }
    
    // Check if parent department exists and belongs to the same organization
    if (parent_id) {
      // Prevent circular reference
      if (parseInt(parent_id) === parseInt(id)) {
        return res.status(400).json({ error: 'Department cannot be its own parent' });
      }
      
      const parentCheck = await pgPool.query(
        'SELECT organization_id FROM core.departments WHERE id = $1',
        [parent_id]
      );
      
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Parent department not found' });
      }
      
      if (parentCheck.rows[0].organization_id !== organization_id) {
        return res.status(400).json({ error: 'Parent department belongs to a different organization' });
      }
      
      // Check for circular reference in the hierarchy
      const checkCircularRef = async (childId, targetId) => {
        const children = await pgPool.query(
          'SELECT id FROM core.departments WHERE parent_id = $1',
          [childId]
        );
        
        for (const child of children.rows) {
          if (parseInt(child.id) === parseInt(targetId)) {
            return true;
          }
          
          const hasCircular = await checkCircularRef(child.id, targetId);
          if (hasCircular) {
            return true;
          }
        }
        
        return false;
      };
      
      const hasCircular = await checkCircularRef(id, parent_id);
      if (hasCircular) {
        return res.status(400).json({ error: 'Circular reference in department hierarchy' });
      }
    }
    
    // Check if head employee exists and belongs to the same organization
    if (head_employee_id) {
      const headCheck = await pgPool.query(
        'SELECT organization_id FROM hr.employees WHERE id = $1',
        [head_employee_id]
      );
      
      if (headCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Head employee not found' });
      }
      
      if (headCheck.rows[0].organization_id !== organization_id) {
        return res.status(400).json({ error: 'Head employee belongs to a different organization' });
      }
    }
    
    const result = await pgPool.query(
      `UPDATE core.departments 
      SET name = COALESCE($1, name), 
          code = COALESCE($2, code), 
          parent_id = $3, 
          head_employee_id = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, organization_id, name, code, parent_id, head_employee_id, created_at, updated_at`,
      [name, code, parent_id, head_employee_id, id]
    );
    
    res.status(200).json({
      message: 'Department updated successfully',
      department: result.rows[0]
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete department
 */
const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if department exists
    const deptCheck = await pgPool.query(
      'SELECT id FROM core.departments WHERE id = $1',
      [id]
    );
    
    if (deptCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Check if department has child departments
    const childCheck = await pgPool.query(
      'SELECT id FROM core.departments WHERE parent_id = $1 LIMIT 1',
      [id]
    );
    
    if (childCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete department with child departments' });
    }
    
    // Check if department has employees
    const empCheck = await pgPool.query(
      'SELECT id FROM hr.employees WHERE department_id = $1 LIMIT 1',
      [id]
    );
    
    if (empCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete department with assigned employees' });
    }
    
    await pgPool.query(
      'DELETE FROM core.departments WHERE id = $1',
      [id]
    );
    
    res.status(200).json({
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
