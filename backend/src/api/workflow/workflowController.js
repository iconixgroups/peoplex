// Workflow Controller for People X
const { pgPool } = require('../../config/database');

/**
 * Get all workflow definitions for an organization
 */
const getWorkflowDefinitions = async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pgPool.query(
      `SELECT id, name, description, module, trigger_event, is_active, created_at, updated_at
      FROM workflow.workflow_definitions
      WHERE organization_id = $1
      ORDER BY name`,
      [organizationId]
    );
    
    res.status(200).json({
      workflowDefinitions: result.rows
    });
  } catch (error) {
    console.error('Get workflow definitions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get workflow definition by ID
 */
const getWorkflowDefinitionById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT id, organization_id, name, description, module, trigger_event, 
      is_active, created_at, updated_at
      FROM workflow.workflow_definitions
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow definition not found' });
    }
    
    // Get workflow steps
    const stepsResult = await pgPool.query(
      `SELECT id, step_type, step_order, name, description, action_type, 
      action_config, condition_type, condition_config
      FROM workflow.workflow_steps
      WHERE workflow_definition_id = $1
      ORDER BY step_order`,
      [id]
    );
    
    const workflowDefinition = {
      ...result.rows[0],
      steps: stepsResult.rows
    };
    
    res.status(200).json({
      workflowDefinition
    });
  } catch (error) {
    console.error('Get workflow definition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create new workflow definition
 */
const createWorkflowDefinition = async (req, res) => {
  const { 
    organization_id, name, description, module, trigger_event, is_active
  } = req.body;
  
  if (!organization_id || !name || !module || !trigger_event) {
    return res.status(400).json({ error: 'Organization ID, name, module, and trigger event are required' });
  }
  
  try {
    const result = await pgPool.query(
      `INSERT INTO workflow.workflow_definitions 
      (organization_id, name, description, module, trigger_event, is_active, created_by, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, name, module, trigger_event, is_active`,
      [
        organization_id, name, description, module, trigger_event, 
        is_active !== undefined ? is_active : true, req.user.id
      ]
    );
    
    res.status(201).json({
      message: 'Workflow definition created successfully',
      workflowDefinition: result.rows[0]
    });
  } catch (error) {
    console.error('Create workflow definition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update workflow definition
 */
const updateWorkflowDefinition = async (req, res) => {
  const { id } = req.params;
  const { 
    name, description, module, trigger_event, is_active
  } = req.body;
  
  try {
    // Check if workflow definition exists
    const workflowCheck = await pgPool.query(
      'SELECT id FROM workflow.workflow_definitions WHERE id = $1',
      [id]
    );
    
    if (workflowCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow definition not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE workflow.workflow_definitions 
      SET name = COALESCE($1, name), 
          description = $2, 
          module = COALESCE($3, module), 
          trigger_event = COALESCE($4, trigger_event),
          is_active = COALESCE($5, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, name, module, trigger_event, is_active`,
      [
        name, description, module, trigger_event, is_active, id
      ]
    );
    
    res.status(200).json({
      message: 'Workflow definition updated successfully',
      workflowDefinition: result.rows[0]
    });
  } catch (error) {
    console.error('Update workflow definition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add workflow step
 */
const addWorkflowStep = async (req, res) => {
  const { workflow_definition_id } = req.params;
  const { 
    step_type, name, description, action_type, action_config,
    condition_type, condition_config
  } = req.body;
  
  if (!step_type || !name) {
    return res.status(400).json({ error: 'Step type and name are required' });
  }
  
  if (step_type === 'action' && !action_type) {
    return res.status(400).json({ error: 'Action type is required for action steps' });
  }
  
  if (step_type === 'condition' && !condition_type) {
    return res.status(400).json({ error: 'Condition type is required for condition steps' });
  }
  
  try {
    // Check if workflow definition exists
    const workflowCheck = await pgPool.query(
      'SELECT id FROM workflow.workflow_definitions WHERE id = $1',
      [workflow_definition_id]
    );
    
    if (workflowCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow definition not found' });
    }
    
    // Get next step order
    const orderResult = await pgPool.query(
      'SELECT COALESCE(MAX(step_order), 0) + 1 as next_order FROM workflow.workflow_steps WHERE workflow_definition_id = $1',
      [workflow_definition_id]
    );
    const stepOrder = orderResult.rows[0].next_order;
    
    const result = await pgPool.query(
      `INSERT INTO workflow.workflow_steps 
      (workflow_definition_id, step_type, step_order, name, description, 
      action_type, action_config, condition_type, condition_config, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, step_type, step_order, name, action_type, condition_type`,
      [
        workflow_definition_id, step_type, stepOrder, name, description,
        action_type, action_config, condition_type, condition_config
      ]
    );
    
    res.status(201).json({
      message: 'Workflow step added successfully',
      workflowStep: result.rows[0]
    });
  } catch (error) {
    console.error('Add workflow step error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update workflow step
 */
const updateWorkflowStep = async (req, res) => {
  const { step_id } = req.params;
  const { 
    step_type, step_order, name, description, action_type, action_config,
    condition_type, condition_config
  } = req.body;
  
  try {
    // Check if workflow step exists
    const stepCheck = await pgPool.query(
      'SELECT id, workflow_definition_id FROM workflow.workflow_steps WHERE id = $1',
      [step_id]
    );
    
    if (stepCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow step not found' });
    }
    
    const result = await pgPool.query(
      `UPDATE workflow.workflow_steps 
      SET step_type = COALESCE($1, step_type), 
          step_order = COALESCE($2, step_order), 
          name = COALESCE($3, name), 
          description = $4,
          action_type = $5,
          action_config = $6,
          condition_type = $7,
          condition_config = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, step_type, step_order, name, action_type, condition_type`,
      [
        step_type, step_order, name, description,
        action_type, action_config, condition_type, condition_config,
        step_id
      ]
    );
    
    res.status(200).json({
      message: 'Workflow step updated successfully',
      workflowStep: result.rows[0]
    });
  } catch (error) {
    console.error('Update workflow step error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete workflow step
 */
const deleteWorkflowStep = async (req, res) => {
  const { step_id } = req.params;
  
  try {
    // Check if workflow step exists
    const stepCheck = await pgPool.query(
      'SELECT id, workflow_definition_id, step_order FROM workflow.workflow_steps WHERE id = $1',
      [step_id]
    );
    
    if (stepCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow step not found' });
    }
    
    const workflowDefinitionId = stepCheck.rows[0].workflow_definition_id;
    const deletedStepOrder = stepCheck.rows[0].step_order;
    
    // Start a transaction
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete the step
      await client.query(
        'DELETE FROM workflow.workflow_steps WHERE id = $1',
        [step_id]
      );
      
      // Reorder remaining steps
      await client.query(
        `UPDATE workflow.workflow_steps 
        SET step_order = step_order - 1, 
            updated_at = CURRENT_TIMESTAMP
        WHERE workflow_definition_id = $1 AND step_order > $2`,
        [workflowDefinitionId, deletedStepOrder]
      );
      
      await client.query('COMMIT');
      
      res.status(200).json({
        message: 'Workflow step deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete workflow step error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete workflow definition
 */
const deleteWorkflowDefinition = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if workflow definition exists
    const workflowCheck = await pgPool.query(
      'SELECT id FROM workflow.workflow_definitions WHERE id = $1',
      [id]
    );
    
    if (workflowCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow definition not found' });
    }
    
    // Start a transaction
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete all steps
      await client.query(
        'DELETE FROM workflow.workflow_steps WHERE workflow_definition_id = $1',
        [id]
      );
      
      // Delete workflow definition
      await client.query(
        'DELETE FROM workflow.workflow_definitions WHERE id = $1',
        [id]
      );
      
      await client.query('COMMIT');
      
      res.status(200).json({
        message: 'Workflow definition deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete workflow definition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get workflow instances
 */
const getWorkflowInstances = async (req, res) => {
  const { workflowDefinitionId, status } = req.query;
  
  try {
    let query = `
      SELECT wi.id, wi.workflow_definition_id, wi.entity_id, wi.entity_type, 
      wi.status, wi.started_at, wi.completed_at, wi.current_step_id,
      wd.name as workflow_name, wd.module, wd.trigger_event
      FROM workflow.workflow_instances wi
      JOIN workflow.workflow_definitions wd ON wi.workflow_definition_id = wd.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (workflowDefinitionId) {
      query += ` AND wi.workflow_definition_id = $${paramIndex}`;
      queryParams.push(workflowDefinitionId);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND wi.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY wi.started_at DESC`;
    
    const result = await pgPool.query(query, queryParams);
    
    res.status(200).json({
      workflowInstances: result.rows
    });
  } catch (error) {
    console.error('Get workflow instances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get workflow instance by ID
 */
const getWorkflowInstanceById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pgPool.query(
      `SELECT wi.*, wd.name as workflow_name, wd.module, wd.trigger_event
      FROM workflow.workflow_instances wi
      JOIN workflow.workflow_definitions wd ON wi.workflow_definition_id = wd.id
      WHERE wi.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow instance not found' });
    }
    
    // Get instance steps
    const stepsResult = await pgPool.query(
      `SELECT wis.id, wis.workflow_step_id, wis.status, wis.started_at, wis.completed_at, 
      wis.result, wis.error_message,
      ws.step_type, ws.step_order, ws.name as step_name, ws.action_type, ws.condition_type
      FROM workflow.workflow_instance_steps wis
      JOIN workflow.workflow_steps ws ON wis.workflow_step_id = ws.id
      WHERE wis.workflow_instance_id = $1
      ORDER BY wis.started_at`,
      [id]
    );
    
    const workflowInstance = {
      ...result.rows[0],
      steps: stepsResult.rows
    };
    
    res.status(200).json({
      workflowInstance
    });
  } catch (error) {
    console.error('Get workflow instance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Trigger workflow manually
 */
const triggerWorkflow = async (req, res) => {
  const { 
    workflow_definition_id, entity_id, entity_type, input_data
  } = req.body;
  
  if (!workflow_definition_id || !entity_id || !entity_type) {
    return res.status(400).json({ error: 'Workflow definition ID, entity ID, and entity type are required' });
  }
  
  try {
    // Check if workflow definition exists and is active
    const workflowCheck = await pgPool.query(
      'SELECT id, is_active FROM workflow.workflow_definitions WHERE id = $1',
      [workflow_definition_id]
    );
    
    if (workflowCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow definition not found' });
    }
    
    if (!workflowCheck.rows[0].is_active) {
      return res.status(400).json({ error: 'Workflow definition is not active' });
    }
    
    // Create workflow instance
    const instanceResult = await pgPool.query(
      `INSERT INTO workflow.workflow_instances 
      (workflow_definition_id, entity_id, entity_type, status, input_data, started_at, created_at, updated_at) 
      VALUES ($1, $2, $3, 'pending', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
      RETURNING id, workflow_definition_id, entity_id, entity_type, status, started_at`,
      [
        workflow_definition_id, entity_id, entity_type, input_data
      ]
    );
    
    // In a real implementation, this would trigger a background job to process the workflow
    // For this demo, we'll just return the created instance
    
    res.status(201).json({
      message: 'Workflow triggered successfully',
      workflowInstance: instanceResult.rows[0]
    });
  } catch (error) {
    console.error('Trigger workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getWorkflowDefinitions,
  getWorkflowDefinitionById,
  createWorkflowDefinition,
  updateWorkflowDefinition,
  addWorkflowStep,
  updateWorkflowStep,
  deleteWorkflowStep,
  deleteWorkflowDefinition,
  getWorkflowInstances,
  getWorkflowInstanceById,
  triggerWorkflow
};
