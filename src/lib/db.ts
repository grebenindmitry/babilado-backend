/*
 * Copyright (c) 2022. Dmitry Grebenin
 */

import pkg from "pg";
const { Pool } = pkg;
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
