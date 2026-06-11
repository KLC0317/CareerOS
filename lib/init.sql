-- Database schema initialization for Career OS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  target_role VARCHAR(255) NOT NULL DEFAULT 'AI Architect',
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
