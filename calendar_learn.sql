-- ==============================================================
-- Calendar Learn (calendar.learn.net.ge & api.learn.net.ge)
-- MySQL სრული და გამართული სქემა
-- ==============================================================

-- 1. გავთიშოთ საგარეო გასაღებების (Foreign Key) შემოწმება იმპორტის დროს
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
START TRANSACTION;

-- 2. მონაცემთა ბაზის შექმნა და არჩევა
CREATE DATABASE IF NOT EXISTS `api_site_calendar_api` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

USE `api_site_calendar_api`;

-- ==============================================================
-- ნაბიჯი 1: ძველი ცხრილების წაშლა (თუ არსებობს) სწორი თანმიმდევრობით
-- ==============================================================
DROP TABLE IF EXISTS `curriculum_outcomes`;
DROP TABLE IF EXISTS `curriculum_modules`;
DROP TABLE IF EXISTS `uploaded_files`;
DROP TABLE IF EXISTS `api_token_sessions`;
DROP TABLE IF EXISTS `api_users`;

-- ==============================================================
-- ნაბიჯი 2: ცხრილების შექმნა სწორი იერარქიით
-- ==============================================================

-- 1. მომხმარებლები (api_users)
CREATE TABLE `api_users` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` varchar(190) NOT NULL,
  `name` varchar(190) NOT NULL,
  `role` enum('admin','teacher','student') NOT NULL DEFAULT 'student',
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `failed_attempts` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. ტოკენები / სესიები (api_token_sessions)
CREATE TABLE `api_token_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `token_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token_issued_at` datetime(6) NOT NULL,
  `last_activity_at` datetime(6) NOT NULL,
  `revoked_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `user_id` (`user_id`),
  KEY `last_activity_at` (`last_activity_at`),
  CONSTRAINT `fk_api_token_owner` FOREIGN KEY (`user_id`) REFERENCES `api_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. ატვირთული ფაილები (uploaded_files)
CREATE TABLE `uploaded_files` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) UNSIGNED NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'completed',
  `processing_summary` longtext DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_uploaded_files_user` FOREIGN KEY (`user_id`) REFERENCES `api_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. სასწავლო მოდულები (curriculum_modules)
CREATE TABLE `curriculum_modules` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `file_id` bigint(20) UNSIGNED NOT NULL,
  `module_name` varchar(255) NOT NULL,
  `module_type` tinyint(3) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=პროფესიული, 2=ზოგადი, 3=ინტეგრირებული',
  `registration_number` varchar(100) DEFAULT NULL,
  `version_date` varchar(100) DEFAULT NULL,
  `credits` varchar(50) DEFAULT NULL,
  `hours_contact` int(11) DEFAULT NULL,
  `hours_independent` int(11) DEFAULT NULL,
  `hours_evaluation` int(11) DEFAULT NULL,
  `hours_total` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `fk_curriculum_modules_file` FOREIGN KEY (`file_id`) REFERENCES `uploaded_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. სწავლის შედეგები (curriculum_outcomes)
CREATE TABLE `curriculum_outcomes` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `module_id` bigint(20) UNSIGNED NOT NULL,
  `outcome_number` varchar(50) NOT NULL,
  `outcome_name` text NOT NULL,
  `topics` longtext DEFAULT NULL,
  `criteria` longtext DEFAULT NULL,
  `assessment_direction` text DEFAULT NULL,
  `assessment_methods` text DEFAULT NULL,
  `hours_contact` int(11) DEFAULT NULL,
  `hours_independent` int(11) DEFAULT NULL,
  `hours_evaluation` int(11) DEFAULT NULL,
  `hours_total` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `fk_curriculum_outcomes_module` FOREIGN KEY (`module_id`) REFERENCES `curriculum_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. სასწავლო გეგმა / კურიკულუმი Excel-იდან (curriculum_plans)
CREATE TABLE IF NOT EXISTS `curriculum_plans` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `file_id` bigint(20) UNSIGNED NOT NULL,
  `module_order` int(11) DEFAULT NULL,
  `module_name` varchar(255) NOT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `credits` varchar(50) DEFAULT NULL,
  `status` tinyint(3) UNSIGNED NOT NULL DEFAULT 2 COMMENT '1=პროფესიული, 2=ზოგადი, 3=ინტეგრირებული',
  `hours_total` int(11) DEFAULT NULL,
  `hours_contact` int(11) DEFAULT NULL,
  `hours_independent` int(11) DEFAULT NULL,
  `hours_evaluation` int(11) DEFAULT NULL,
  `weekly_schedule` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `fk_curriculum_plans_file` FOREIGN KEY (`file_id`) REFERENCES `uploaded_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. მატერიალური რესურსები Excel-იდან (material_resources)
CREATE TABLE IF NOT EXISTS `material_resources` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `file_id` bigint(20) UNSIGNED NOT NULL,
  `module_name` varchar(255) NOT NULL,
  `learning_environment` varchar(100) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `item_number` varchar(50) DEFAULT NULL,
  `item_name` text NOT NULL,
  `quantity` varchar(50) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `fk_material_resources_file` FOREIGN KEY (`file_id`) REFERENCES `uploaded_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==============================================================
-- ნაბიჯი 3: საწყისი მომხმარებლები
-- ==============================================================
INSERT INTO `api_users` (`id`, `username`, `name`, `role`, `password_hash`, `is_active`, `failed_attempts`, `locked_until`, `created_at`) VALUES
(1, 'admin', 'ადმინისტრატორი', 'admin', 'scrypt$340b7205a22af264b2cc9d33ccf05158$ef6c0e5ec0577562ff621d7e8576435fed5f13029213ee302ee2a698aa2e800e28750134dfb0a9774396c9b707c5141f63a7b326b72c61a52412bbbab17bb6a8', 1, 0, NULL, NOW()),
(2, 'teacher', 'მასწავლებელი (გიორგი)', 'teacher', 'scrypt$a56f8908ff38b027085deed3db861ca9$efa010b1f82b198009001d1d918357d3b3edf209efedd57544f3296245429748921b9c01b10fedf0e05475b6bc65e3ba23f8ae850c7c8187ee9f74d7c14ae2d9', 1, 0, NULL, NOW()),
(3, 'student', 'სტუდენტი (ანა)', 'student', 'scrypt$f3c889bc91e7d4318ba7e29164dcd398$ed181a01e17556b52fe2c45f769e29746ba31059950f0596439a2e0b955e2ed6e25edd30da3fb64b39ef5c8b55df3b723a374e960a1395b101e86f351a67c992', 1, 0, NULL, NOW());

-- ==============================================================
-- ნაბიჯი 4: ტრანზაქციის დადასტურება და შემოწმების ხელახლა ჩართვა
-- ==============================================================
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
