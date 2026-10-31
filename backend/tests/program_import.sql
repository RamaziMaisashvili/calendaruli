USE api_site_calendar_api;
CREATE TABLE IF NOT EXISTS ci_programs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 owner_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(500) NOT NULL,
 name_key CHAR(64) CHARACTER SET ascii NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_ci_program_owner(owner_id,name_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS ci_plans (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 owner_id BIGINT UNSIGNED NOT NULL,
 program_id BIGINT UNSIGNED NOT NULL,
 academic_year VARCHAR(40) NOT NULL,
 program_type VARCHAR(32) NOT NULL,
 start_date DATE NOT NULL,
 source_filename VARCHAR(255) NOT NULL,
 content_hash CHAR(64) CHARACTER SET ascii NOT NULL,
 settings_json LONGTEXT NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_ci_plan_owner(owner_id,content_hash),
 CONSTRAINT fk_ci_plan_program FOREIGN KEY(program_id) REFERENCES ci_programs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS ci_modules (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 plan_id BIGINT UNSIGNED NOT NULL,
 module_order INT NOT NULL,
 source_row INT NOT NULL,
 name VARCHAR(500) NOT NULL,
 code VARCHAR(64) NOT NULL DEFAULT '',
 module_type VARCHAR(32) NOT NULL,
 total_hours DECIMAL(12,2) NOT NULL,
 contact_hours DECIMAL(12,2) NOT NULL,
 independent_hours DECIMAL(12,2) NOT NULL,
 assessment_hours DECIMAL(12,2) NOT NULL,
 UNIQUE KEY uq_ci_module_order(plan_id,module_order),
 CONSTRAINT fk_ci_module_plan FOREIGN KEY(plan_id) REFERENCES ci_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS ci_week_hours (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 module_id BIGINT UNSIGNED NOT NULL,
 week_order INT NOT NULL,
 week_label VARCHAR(100) NOT NULL,
 date_label VARCHAR(200) NULL,
 hours DECIMAL(12,2) NOT NULL,
 UNIQUE KEY uq_ci_module_week(module_id,week_order),
 CONSTRAINT fk_ci_week_module FOREIGN KEY(module_id) REFERENCES ci_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
