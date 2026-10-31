CREATE TABLE IF NOT EXISTS ci_days_off (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 owner_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(200) NOT NULL,
 kind VARCHAR(20) NOT NULL,
 scope VARCHAR(24) NOT NULL,
 start_date DATE NOT NULL,
 end_date DATE NOT NULL,
 annual TINYINT(1) NOT NULL DEFAULT 0,
 INDEX ix_ci_days_off_owner(owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS ci_school_years (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 owner_id BIGINT UNSIGNED NOT NULL,
 academic_year VARCHAR(40) NOT NULL,
 start_date DATE NOT NULL,
 UNIQUE KEY uq_ci_school_year(owner_id,academic_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS ci_calendar_settings (
 plan_id BIGINT UNSIGNED PRIMARY KEY,
 owner_id BIGINT UNSIGNED NOT NULL,
 compensation_mode VARCHAR(20) NOT NULL,
 start_date DATE NOT NULL,
 end_date DATE NOT NULL,
 occupied_saturdays LONGTEXT NOT NULL,
 CONSTRAINT fk_ci_calendar_plan FOREIGN KEY(plan_id) REFERENCES ci_plans(id) ON DELETE CASCADE,
 INDEX ix_ci_calendar_owner(owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
