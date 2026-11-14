
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/index.js';
import { generateToken } from '../utils/jwt.js';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const result = await pool.query(
      `SELECT users.id, users.email, users.password_hash,
              roles.name AS role
       FROM users
       LEFT JOIN roles ON users.role_id = roles.id
       WHERE users.email = $1 AND users.is_active = TRUE`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    if (!user.role) {
      return res.status(403).json({
        message: 'User role is not assigned',
      });
    }

    const token = await generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
});

export default router;
