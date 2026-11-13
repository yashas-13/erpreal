
import { Request, Response } from 'express';
import { pool } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const validStages = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'SITE_VISIT',
  'NEGOTIATION',
  'WON',
  'LOST',
];

const stageTransitions: Record<string, string[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['SITE_VISIT', 'NEGOTIATION', 'LOST'],
  SITE_VISIT: ['NEGOTIATION', 'LOST'],
  NEGOTIATION: ['WON', 'LOST'],
  WON: [],
  LOST: ['NEW'],
};

// GET all leads with filtering and search
export async function getLeads(req: Request, res: Response) {
  try {
    const { stage, agent, search } = req.query;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (stage && stage !== 'All') {
      values.push(String(stage).toUpperCase().replaceAll(' ', '_'));
      conditions.push(`l.stage = $${values.length}`);
    }

    if (agent) {
      values.push(String(agent));
      conditions.push(`l.assigned_agent_id = $${values.length}`);
    }

    if (search) {
      values.push(`%${String(search)}%`);
      conditions.push(
        `(l.contact_name ILIKE $${values.length}
          OR l.contact_phone ILIKE $${values.length}
          OR l.title ILIKE $${values.length}
          OR l.project_name ILIKE $${values.length}
          OR l.source ILIKE $${values.length})`
      );
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await pool.query(
      `SELECT l.*, u.full_name AS owner_name
       FROM leads l
       LEFT JOIN users u ON l.assigned_agent_id = u.id
       ${where}
       ORDER BY l.created_at DESC`,
      values
    );

    return res.status(200).json({
      count: result.rows.length,
      leads: result.rows,
    });
  } catch (error) {
    console.error('Get leads error:', error);
    return res.status(500).json({ message: 'Failed to retrieve leads' });
  }
}

// GET one lead
export async function getLeadById(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT l.*, u.full_name AS owner_name
       FROM leads l
       LEFT JOIN users u ON l.assigned_agent_id = u.id
       WHERE l.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    return res.status(200).json({ lead: result.rows[0] });
  } catch (error) {
    console.error('Get lead error:', error);
    return res.status(500).json({ message: 'Failed to retrieve lead' });
  }
}

// CREATE a lead
export async function createLead(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const {
      title,
      contact_name,
      contact_email,
      contact_phone,
      source,
      project_name,
      budget_min,
      budget_max,
      budget_display,
      assigned_agent_id,
    } = req.body;

    if (!title || !contact_name || !contact_phone) {
      return res.status(400).json({
        message: 'Title, contact name and phone are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO leads (
        title, contact_name, contact_email, contact_phone,
        source, project_name, budget_min, budget_max,
        budget_display, assigned_agent_id, stage
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'NEW')
      RETURNING *`,
      [
        title,
        contact_name,
        contact_email || null,
        contact_phone,
        source || null,
        project_name || null,
        budget_min ?? null,
        budget_max ?? null,
        budget_display || null,
        assigned_agent_id || null,
      ]
    );

    return res.status(201).json({
      message: 'Lead created successfully',
      lead: result.rows[0],
    });
  } catch (error) {
    console.error('Create lead error:', error);
    return res.status(500).json({ message: 'Failed to create lead' });
  }
}

// UPDATE lead details
export async function updateLead(req: Request, res: Response) {
  try {
    const {
      title,
      contact_name,
      contact_email,
      contact_phone,
      source,
      project_name,
      budget_min,
      budget_max,
      budget_display,
      assigned_agent_id,
    } = req.body;

    const result = await pool.query(
      `UPDATE leads SET
        title = COALESCE($1, title),
        contact_name = COALESCE($2, contact_name),
        contact_email = COALESCE($3, contact_email),
        contact_phone = COALESCE($4, contact_phone),
        source = COALESCE($5, source),
        project_name = COALESCE($6, project_name),
        budget_min = COALESCE($7, budget_min),
        budget_max = COALESCE($8, budget_max),
        budget_display = COALESCE($9, budget_display),
        assigned_agent_id = COALESCE($10, assigned_agent_id),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        title ?? null,
        contact_name ?? null,
        contact_email ?? null,
        contact_phone ?? null,
        source ?? null,
        project_name ?? null,
        budget_min ?? null,
        budget_max ?? null,
        budget_display ?? null,
        assigned_agent_id ?? null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    return res.status(200).json({
      message: 'Lead updated successfully',
      lead: result.rows[0],
    });
  } catch (error) {
    console.error('Update lead error:', error);
    return res.status(500).json({ message: 'Failed to update lead' });
  }
}

// UPDATE lead stage with transition validation
export async function updateLeadStage(req: Request, res: Response) {
  try {
    const { stage } = req.body;
    const newStage = String(stage || '').toUpperCase().replaceAll(' ', '_');

    if (!validStages.includes(newStage)) {
      return res.status(400).json({ message: 'Invalid lead stage' });
    }

    const current = await pool.query(
      'SELECT stage FROM leads WHERE id = $1',
      [req.params.id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const currentStage = current.rows[0].stage;

    if (!stageTransitions[currentStage]?.includes(newStage)) {
      return res.status(400).json({
        message: `Cannot move lead from ${currentStage} to ${newStage}`,
      });
    }

    const result = await pool.query(
      `UPDATE leads
       SET stage = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newStage, req.params.id]
    );

    return res.status(200).json({
      message: 'Lead stage updated successfully',
      lead: result.rows[0],
    });
  } catch (error) {
    console.error('Update lead stage error:', error);
    return res.status(500).json({ message: 'Failed to update lead stage' });
  }
}

// DELETE a lead
export async function deleteLead(req: Request, res: Response) {
  try {
    const result = await pool.query(
      'DELETE FROM leads WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    return res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    return res.status(500).json({ message: 'Failed to delete lead' });
  }
}
