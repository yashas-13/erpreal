
import { Request, Response } from 'express';
import { pool } from '../db/index.js';

export const getDashboardMetrics = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = performance.now();

  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE stage NOT IN ('WON', 'LOST')
        ) AS active_leads,

        COALESCE(
          SUM(budget_max) FILTER (
            WHERE stage NOT IN ('WON', 'LOST')
          ),
          0
        ) AS pipeline_value,

        COUNT(*) FILTER (
          WHERE stage = 'WON'
        ) AS won_leads,

        COUNT(*) AS total_leads,

        COALESCE(
          ROUND(
            COUNT(*) FILTER (WHERE stage = 'WON')::NUMERIC
            * 100 / NULLIF(COUNT(*), 0),
            2
          ),
          0
        ) AS conversion_rate,

        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'stage', stage,
                'count', lead_count
              )
              ORDER BY stage
            ),
            '[]'::JSON
          )
          FROM (
            SELECT stage, COUNT(*) AS lead_count
            FROM leads
            GROUP BY stage
          ) AS stage_counts
        ) AS leads_by_stage

      FROM leads;
    `);

    const queryTime = Number(
      (performance.now() - startTime).toFixed(2)
    );

    res.status(200).json({
      success: true,
      metrics: result.rows[0],
      queryTimeMs: queryTime,
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
    });
  }
};
