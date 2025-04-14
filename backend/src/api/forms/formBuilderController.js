// Form Builder Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all form templates for an organization
 */
const getFormTemplates = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT id, name, description, module, is_active, created_at, updated_at
      FROM forms.form_templates
      WHERE organization_id = $1
      ORDER BY name`,
      [organizationId]
    );
    
    res.status(200).json({
      formTemplates: result.rows
    });
  } catch (error) {
    console.error('Get form templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get form template by ID
 */
const getFormTemplateById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT id, organization_id, name, description, module, 
      is_active, created_at, updated_at
      FROM forms.form_templates
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form template not found' });
    }
    
    // Get form fields
    const fieldsResult = await pgPool.query(
      `SELECT id, field_name, field_label, field_type, field_order, 
      is_required, default_value, options, validation_rules, help_text
      FROM forms.form_fields
      WHERE form_template_id = $1
      ORDER BY field_order`,
      [id]
    );
    
    const formTemplate = {
      ...result.rows[0],
      fields: fieldsResult.rows
    };
    
    res.status(200).json({
      formTemplate
    });
  } catch (error) {
    console.error('Get form template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new form template
 */
const createFormTemplate = async (req, res) => {
  const { 
    organization_id, name, description, module, is_active
  } = req.body;
  
  if (!organization_id || !name || !module) {
    return res.status(400).json({ error: 'Organization ID, name, and module are required' });
  }
  
  try {
    const result = await pgPool.query(
      `INSERT INTO forms.form_templates 
      (organization_id, name, description, module, is_active, created_by, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, module, is_active`,
      [
        organization_id, name, description, module, 
        is_active !== undefined ? is_active : true, req.user.id
      ]
    );
    
    res.status(201).json({
      message: 'Form template created successfully',
      formTemplate: result.rows[0]
    });
  } catch (error) {
    console.error('Create form template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update form template
 */
const updateFormTemplate = async (req, res) => {
  const { id } = req.params;
  const { 
    name, description, module, is_active
  } = req.body;
  
  try {
    // Check if form template exists
    const templateCheck = await pgPool.query(
      'SELECT id FROM forms.form_templates WHERE id = $1',
      [id]
    );
    
    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form template not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE forms.form_templates 
      SET name = COALESCE($1, name), 
          description = $2, 
          module = COALESCE($3, module), 
          is_active = COALESCE($4, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, module, is_active`,
      [
        name, description, module, is_active, id
      ]
    );
    
    res.status(200).json({
      message: 'Form template updated successfully',
      formTemplate: result.rows[0]
    });
  } catch (error) {
    console.error('Update form template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add form field
 */
const addFormField = async (req, res) => {
  const { form_template_id } = req.params;
  const { 
    field_name, field_label, field_type, is_required,
    default_value, options, validation_rules, help_text
  } = req.body;
  
  if (!field_name || !field_label || !field_type) {
    return res.status(400).json({ error: 'Field name, label, and type are required' });
  }
  
  try {
    // Check if form template exists
    const templateCheck = await pgPool.query(
      'SELECT id FROM forms.form_templates WHERE id = $1',
      [form_template_id]
    );
    
    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form template not found' });
    }
    
    // Check if field name already exists in this template
    const fieldCheck = await pgPool.query(
      'SELECT id FROM forms.form_fields WHERE form_template_id = $1 AND field_name = $2',
      [form_template_id, field_name]
    );
    
    if (fieldCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Field name already exists in this template' });
    }
    
    // Get next field order
    const orderResult = await pgPool.query(
      'SELECT COALESCE(MAX(field_order), 0) + 1 as next_order FROM forms.form_fields WHERE form_template_id = $1',
      [form_template_id]
    );
    const fieldOrder = orderResult.rows[0].next_order;
    
    const result = await pgPool.query(
      `INSERT INTO forms.form_fields 
      (form_template_id, field_name, field_label, field_type, field_order, 
      is_required, default_value, options, validation_rules, help_text, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, field_name, field_label, field_type, field_order, is_required`,
      [
        form_template_id, field_name, field_label, field_type, fieldOrder,
        is_required || false, default_value, options, validation_rules, help_text
      ]
    );
    
    res.status(201).json({
      message: 'Form field added successfully',
      formField: result.rows[0]
    });
  } catch (error) {
    console.error('Add form field error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update form field
 */
const updateFormField = async (req, res) => {
  const { field_id } = req.params;
  const { 
    field_name, field_label, field_type, field_order, is_required,
    default_value, options, validation_rules, help_text
  } = req.body;
  
  try {
    // Check if field exists
    const fieldCheck = await pgPool.query(
      'SELECT id, form_template_id FROM forms.form_fields WHERE id = $1',
      [field_id]
    );
    
    if (fieldCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form field not found' });
    }
    
    // Check if field name already exists in this template if changing
    if (field_name) {
      const nameCheck = await pgPool.query(
        'SELECT id FROM forms.form_fields WHERE form_template_id = $1 AND field_name = $2 AND id != $3',
        [fieldCheck.rows[0].form_template_id, field_name, field_id]
      );
      
      if (nameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Field name already exists in this template' });
      }
    }
    
    const result = await pgPool.query(
      `UPDATE forms.form_fields 
      SET field_name = COALESCE($1, field_name), 
          field_label = COALESCE($2, field_label), 
          field_type = COALESCE($3, field_type), 
          field_order = COALESCE($4, field_order),
          is_required = COALESCE($5, is_required),
          default_value = $6,
          options = $7,
          validation_rules = $8,
          help_text = $9,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING id, field_name, field_label, field_type, field_order, is_required`,
      [
        field_name, field_label, field_type, field_order, is_required,
        default_value, options, validation_rules, help_text, field_id
      ]
    );
    
    res.status(200).json({
      message: 'Form field updated successfully',
      formField: result.rows[0]
    });
  } catch (error) {
    console.error('Update form field error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete form field
 */
const deleteFormField = async (req, res) => {
  const { field_id } = req.params;
  
  try {
    // Check if field exists
    const fieldCheck = await pgPool.query(
      'SELECT id, form_template_id, field_order FROM forms.form_fields WHERE id = $1',
      [field_id]
    );
    
    if (fieldCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form field not found' });
    }
    
    const formTemplateId = fieldCheck.rows[0].form_template_id;
    const deletedFieldOrder = fieldCheck.rows[0].field_order;
    
    // Start a transaction
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete the field
      await client.query(
        'DELETE FROM forms.form_fields WHERE id = $1',
        [field_id]
      );
      
      // Reorder remaining fields
      await client.query(
        `UPDATE forms.form_fields 
        SET field_order = field_order - 1, 
            updated_at = CURRENT_TIMESTAMP
        WHERE form_template_id = $1 AND field_order > $2`,
        [formTemplateId, deletedFieldOrder]
      );
      
      await client.query('COMMIT');
      
      res.status(200).json({
        message: 'Form field deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete form field error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete form template
 */
const deleteFormTemplate = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if form template exists
    const templateCheck = await pgPool.query(
      'SELECT id FROM forms.form_templates WHERE id = $1',
      [id]
    );
    
    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form template not found' });
    }
    
    // Check if form template has submissions
    const submissionCheck = await pgPool.query(
      'SELECT id FROM forms.form_submissions WHERE form_template_id = $1 LIMIT 1',
      [id]
    );
    
    if (submissionCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete form template with existing submissions' });
    }
    
    // Start a transaction
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete all fields
      await client.query(
        'DELETE FROM forms.form_fields WHERE form_template_id = $1',
        [id]
      );
      
      // Delete form template
      await client.query(
        'DELETE FROM forms.form_templates WHERE id = $1',
        [id]
      );
      
      await client.query('COMMIT');
      
      res.status(200).json({
        message: 'Form template deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete form template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Submit form
 */
const submitForm = async (req, res) => {
  const { 
    form_template_id, entity_id, entity_type, form_data
  } = req.body;
  
  if (!form_template_id || !form_data) {
    return res.status(400).json({ error: 'Form template ID and form data are required' });
  }
  
  try {
    // Check if form template exists and is active
    const templateCheck = await pgPool.query(
      'SELECT id, is_active FROM forms.form_templates WHERE id = $1',
      [form_template_id]
    );
    
    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Form template not found' });
    }
    
    if (!templateCheck.rows[0].is_active) {
      return res.status(400).json({ error: 'Form template is not active' });
    }
    
    // Get form fields to validate submission
    const fieldsResult = await pgPool.query(
      `SELECT id, field_name, field_type, is_required, validation_rules
      FROM forms.form_fields
      WHERE form_template_id = $1`,
      [form_template_id]
    );
    
    const fields = fieldsResult.rows;
    
    // Validate required fields
    for (const field of fields) {
      if (field.is_required && (!form_data[field.field_name] || form_data[field.field_name] === '')) {
        return res.status(400).json({ error: `Field '${field.field_name}' is required` });
      }
      
      // Additional validation could be implemented here based on field.validation_rules
    }
    
    // Create form submission
    const result = await pgPool.query(
      `INSERT INTO forms.form_submissions 
      (form_template_id, entity_id, entity_type, form_data, submitted_by, submitted_at, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, form_template_id, entity_id, entity_type, submitted_at`,
      [
        form_template_id, entity_id, entity_type, form_data, req.user.id
      ]
    );
    
    res.status(201).json({
      message: 'Form submitted successfully',
      formSubmission: result.rows[0]
    });
  } catch (error) {
    console.error('Submit form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get form submissions
 */
const getFormSubmissions = async (req, res) => {
  const { form_template_id, entity_id, entity_type } = req.query;
  
  try {
    let query = `
      SELECT fs.id, fs.form_template_id, fs.entity_id, fs.entity_type, 
      fs.submitted_by, fs.submitted_at, ft.name as form_name,
      CONCAT(e.first_name, ' ', e.last_name) as submitted_by_name
      FROM forms.form_submissions fs
      JOIN forms.form_templates ft ON fs.form_template_id = ft.id
      LEFT JOIN hr.employees e ON fs.submitted_by = e.user_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (form_template_id) {
      query += ` AND fs.form_template_id = $${paramIndex}`;
      queryParams.push(form_template_id);
      paramIndex++;
    }
    
    if (entity_id) {
      query += ` AND fs.entity_id = $${paramIndex}`;
      queryParams.push(entity_id);
      paramIndex++;
    }
    
    if (entity_type) {
      query += ` AND fs.entity_type = $${paramIndex}`;
      queryParams.push(entity_type);
      paramIndex++;
    }
    
    query += ` ORDER BY fs.submitted_at DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      formSubmissions: result.rows
    });
  } catch (error) {
    console.error('Get form submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get form submission by ID
 */
const getFormSubmissionById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT fs.*, ft.name as form_name, ft.module,
      CONCAT(e.first_name, ' ', e.last_name) as submitted_by_name
      FROM forms.form_submissions fs
      JOIN forms.form_templates ft ON fs.form_template_id = ft.id
      LEFT JOIN hr.employees e ON fs.submitted_by = e.user_id
      WHERE fs.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form submission not found' });
    }
    
    // Get form fields
    const fieldsResult = await pgPool.query(
      `SELECT id, field_name, field_label, field_type, field_order, is_required
      FROM forms.form_fields
      WHERE form_template_id = $1
      ORDER BY field_order`,
      [result.rows[0].form_template_id]
    );
    
    const formSubmission = {
      ...result.rows[0],
      fields: fieldsResult.rows
    };
    
    res.status(200).json({
      formSubmission
    });
  } catch (error) {
    console.error('Get form submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getFormTemplates,
  getFormTemplateById,
  createFormTemplate,
  updateFormTemplate,
  addFormField,
  updateFormField,
  deleteFormField,
  deleteFormTemplate,
  submitForm,
  getFormSubmissions,
  getFormSubmissionById
};
