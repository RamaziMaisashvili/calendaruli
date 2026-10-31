USE calendar_api;
CREATE TABLE IF NOT EXISTS api_users (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 username VARCHAR(190) NOT NULL UNIQUE,
 name VARCHAR(190) NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 failed_attempts INT UNSIGNED NOT NULL DEFAULT 0,
 locked_until DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- New table does not alter existing api_sessions or user records.
CREATE TABLE IF NOT EXISTS api_token_sessions (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 user_id BIGINT UNSIGNED NOT NULL,
 token_issued_at DATETIME(6) NOT NULL,
 last_activity_at DATETIME(6) NOT NULL,
 revoked_at DATETIME(6) NULL,
 INDEX(user_id), INDEX(last_activity_at),
 CONSTRAINT fk_api_token_owner FOREIGN KEY(user_id) REFERENCES api_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
