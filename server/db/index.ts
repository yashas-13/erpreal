import { Pool } from 'pg';

export const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: Number(process.env.PGPORT || 5432),
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});

export default pool;