CREATE TABLE IF NOT EXISTS ci_plan_breaks (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 plan_id BIGINT UNSIGNED NOT NULL,
 owner_id BIGINT UNSIGNED NOT NULL,
 calendar_year SMALLINT UNSIGNED NOT NULL,
 template_key VARCHAR(20) NOT NULL,
 enabled TINYINT(1) NOT NULL,
 start_date DATE NULL,
 end_date DATE NULL,
 UNIQUE KEY uq_ci_plan_break(plan_id,calendar_year,template_key),
 INDEX ix_ci_plan_break_owner(owner_id),
 CONSTRAINT fk_ci_plan_break FOREIGN KEY(plan_id) REFERENCES ci_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
