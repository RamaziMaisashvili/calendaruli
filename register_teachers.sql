-- ==============================================================
-- Calendar Learn — მასწავლებლების რეგისტრაციის SQL სკრიპტი
-- დეფოლტ პაროლი ყველა მომხმარებლისთვის: 1234
-- უსაფრთხოა: მუშაობს ნებისმიერ MySQL / MariaDB სერვერზე (ON DUPLICATE KEY UPDATE)
-- ==============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. api_users ცხრილში role ველის დამატება (მხოლოდ თუ ჯერ არ არსებობს)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'api_users' AND COLUMN_NAME = 'role');
SET @alter_sql = IF(@col_exists = 0, "ALTER TABLE `api_users` ADD COLUMN `role` ENUM('admin','teacher','student') NOT NULL DEFAULT 'teacher' AFTER `name`", "SELECT 1");
PREPARE stmt_role FROM @alter_sql;
EXECUTE stmt_role;
DEALLOCATE PREPARE stmt_role;

-- 2. api_users — მომხმარებლების შექმნა/განახლება (დეფოლტ პაროლი: 1234)
INSERT INTO `api_users` (`username`, `name`, `role`, `password_hash`, `is_active`, `failed_attempts`) VALUES
('ludvigi', 'ლუდვიგი ხუხუნაიშვილი', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('saba', 'საბა ბაბლუანი', 'teacher', 'scrypt$77ff9f65daa182220565ff5efd85b33f$65fdc5d60630593ee2296b30376175e433c38d41f4088a1f0de6bde65541e402feb8d42a4d5f12da93c8932de4fe969acdf1471648b4ca0141139979bcf5f24a', 1, 0),
('mariam', 'მარიამ კაკიაშვილი', 'teacher', 'scrypt$e14877da01e27c968a275c6157afc67d$9f34b31249f02bd91fac3288a84ee68b2c8933c73f44a904a5ca46f69ca57ca8861b3b21b217ec420b66deefe9a6a43dae39ba7ed34722a532e4159001d766a9', 1, 0),
('nika_aptsiauri', 'ნიკა აფციაური', 'teacher', 'scrypt$258d363cf0f770f9f680a936939b9a5c$a139c614724f307b8843c3f631f1857cc9a51414d98224cd53206465dc07cda3daf0ffcb2ec4c26276f6b75598a7dcb424c0f779db15488e949262ad392c2bae', 1, 0),
('shota', 'შოთა აბაშიძე', 'teacher', 'scrypt$c7714e4d975ff2ef5cfa81468275c1d9$c9be20b823dff23e83c7471d7216c57924e64ca671ef0c1b87d4cb2bddddb102279ccd5218cc4acc6d6555e53c23f689b212e47beb571e20cd52f73bda944990', 1, 0),
('kristine', 'ქრისტინე მეგრელიშვილი', 'teacher', 'scrypt$ddb8d153c7d47c97cc238d2dc8faf6a0$b69cecbd99ca0193ab82d7f68cc34481c5fac268ba171f14678981f44805b4c213c0b535a2645213cadc01d7ff1ac726f67cc754bd1d1f47901c12a823cda26e', 1, 0),
('tornike', 'თორნიკე ბურჯანაძე', 'teacher', 'scrypt$34baa0dcf3b1b0a27c18a1b8a81a2a34$bf607c3c222ea70affaf49bc737af877c8fe524418011750899c5e87437440671bb03b9755d6a0d735ecf1429e75a7bc839ce417d364f8fa77d11fec74236964', 1, 0),
('nika_saladze', 'ნიკა სალაძე', 'teacher', 'scrypt$224c2e11978472748f35d3bfe3da32b9$880673b662da5d069fee6bdf099e06e67717f97d68efef5057782b9afc0539cd32d920c3686ea4ccd305e2060c977ca3836dae10dd5125b4718f81324c3b1117', 1, 0),
('giorgi_chitanava', 'გიორგი ჭითანავა', 'teacher', 'scrypt$861d9746b04f0a92a98ff627d33785f0$6a0ca3aa5a309a1fb9660704d0407ddba57adb1d619903fa1abc522953d1be57b193d92bed847886d418861f0aa91505f82f17f833dc7f6d7d7e8ffebe72d676', 1, 0),
('ketevan', 'ქეთევან სალაღოვი', 'teacher', 'scrypt$32567730c40904c62ac74f74ca71d6a4$45a22c0ca7cd79128f956c6e7183609c2b64e999f0623f301b0f6373d9b3625bfb297848a297d34742ca896faf72721d75f8b850b459b49b8f512e383e8137e2', 1, 0),
('shota_kvaratskhelia', 'შოთა კვარაცხელია', 'teacher', 'scrypt$d589cd8eb3111917e50118b47ddb6cc1$52ae1a54d9b6c284621b51ec2cfe256db7503f30eee017ee9510b32690bf6a17da69c8205697a527bea9a444d691c028350daf45bfe208ee2a576bf8213d1eda', 1, 0),
('khatia', 'ხატია აფრასიძე', 'teacher', 'scrypt$f91801c7322aa2d34ac62a987281ce84$cc11c8224c0267c544c92049b9cab2db47335711afce1fc14f1e4f1e3d63b7eeb67f90d40b0f21d8a4ca59a1d43e40ed1e2f1a04f9820ab05eff20c09446630b', 1, 0),
('nana', 'ნანა ლაბაძე', 'teacher', 'scrypt$85d324de722731d5f1ef48ccc2470bc1$dae266e9ca13696aea265678d9ff463068e2c1caa0cfd68bc608ef0ee9df544228a84831dd90d457d16de72593d9722248a12db9629c74944bc5b6e55e1a8437', 1, 0),
('enek', 'ენეკ ფრეია პეტერსონი', 'teacher', 'scrypt$8b4a489bb560bbf3b2c8386b9d6175a7$d6b8a100c3ba44be0714a1b874269ae8ffecbd75e779da772f3cb27937ef15ffe9c314f3a236371f9eab274b0af21fed3327ddd885f292f734170167ccbe77c3', 1, 0),
('shorena', 'შორენა აბულაძე', 'teacher', 'scrypt$ab571e25f809f1b7d5dfefe2db97798b$bf2154942108cd1c810e2e081d394e74a8542cbe3f1573d36ce479f4cda4f80c5243cb4128418f6acac795982c1b0d9a0df2e53dd608fb793d58ecc401a5fbcc', 1, 0),
('inga_machitadze', 'ინგა მაჩიტაძე', 'teacher', 'scrypt$b18e9d83b1f515188b98b695a763feb7$7a6f6fbd0cfd03e872f5f0aa074fd31279b5dcd27583cc7e399b645d4f5b2afc61a19738f438470cfd7091d7d5d0a0789544c41987eec37c268ae44e151a67c5', 1, 0),
('jondo', 'ჯონდო ტალაბაძე', 'teacher', 'scrypt$ddc1898284e0ab0ab35360b77c0ed19f$a459f9983214ab6d2c6b8279347536fc4effb0134426f962c115449590cecba9adbade3356ebc73df4f5bd1ff0e35bed0293b8cf965c05715368ace61bbbdb31', 1, 0)
ON DUPLICATE KEY UPDATE 
`name` = VALUES(`name`),
`role` = VALUES(`role`),
`password_hash` = VALUES(`password_hash`),
`is_active` = 1;

-- 3. ნიკა ქობულაძის საკონტაქტო მონაცემების განახლება
UPDATE `ci_teachers` 
SET `phone` = '598360361', `email` = 'nikakobuladze7@gmail.com' 
WHERE `first_name` = 'ნიკა' AND `last_name` = 'ქობულაძე';

-- 4. ci_teachers — მასწავლებელთა პროფილების შექმნა (user_id-ის ავტომატური დაკავშირებით)
INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'ლუდვიგი', 'ხუხუნაიშვილი', '505 557458', 'Mr.ludvigikhukhunaishvili@gmail.com' FROM `api_users` WHERE username = 'ludvigi'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'საბა', 'ბაბლუანი', '551 07 51 05', 'Sababablo@gmail.com' FROM `api_users` WHERE username = 'saba'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'მარიამ', 'კაკიაშვილი', '579 009 247', 'mariam.kakiashvili29@gmail.com' FROM `api_users` WHERE username = 'mariam'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'ნიკა', 'აფციაური', '597 61 06 15', 'afciaurinikusha28@gmail.com' FROM `api_users` WHERE username = 'nika_aptsiauri'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'შოთა', 'აბაშიძე', '577-033-819', 'shotaabashidze88@gmail.com' FROM `api_users` WHERE username = 'shota'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'ქრისტინე', 'მეგრელიშვილი', '555 16 55 86', 'megrelishvilikristine@gmail.com' FROM `api_users` WHERE username = 'kristine'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'თორნიკე', 'ბურჯანაძე', '555462090', 'tornikeburjanadze0@gmail.com' FROM `api_users` WHERE username = 'tornike'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'ნიკა', 'სალაძე', '568 35 65 65', 'SALADZENIKA727@GMAIL.COM' FROM `api_users` WHERE username = 'nika_saladze'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'გიორგი', 'ჭითანავა', '574037389', 'tchitanavagiorgi8@gmail.com' FROM `api_users` WHERE username = 'giorgi_chitanava'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'ქეთევან', 'სალაღოვი', '551495777', 'salaghoviqeti@gmail.com' FROM `api_users` WHERE username = 'ketevan'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'შოთა', 'კვარაცხელია', '596103110', 'shota.kvaratskhelia2018@gmail.com' FROM `api_users` WHERE username = 'shota_kvaratskhelia'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'ხატია', 'აფრასიძე', '599244304', 'khatia.aprasidze@weaedu.ge' FROM `api_users` WHERE username = 'khatia'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'ნანა', 'ლაბაძე', '599316743', 'nanallabadze@gmail.com' FROM `api_users` WHERE username = 'nana'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'ენეკ ფრეია', 'პეტერსონი', '599506427', 'Enek.peterson@gmail.com' FROM `api_users` WHERE username = 'enek'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'შორენა', 'აბულაძე', '591320075', 'Shorena1abuladze@gmail.com' FROM `api_users` WHERE username = 'shorena'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'ინგა', 'მაჩიტაძე', '598654243', 'i.machitidze1970@gmail.com' FROM `api_users` WHERE username = 'inga_machitadze'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `ci_teachers` (`owner_id`, `user_id`, `first_name`, `last_name`, `phone`, `email`)
SELECT 1, id, 'ჯონდო', 'ტალაბაძე', '', '' FROM `api_users` WHERE username = 'jondo'
ON DUPLICATE KEY UPDATE `first_name` = VALUES(`first_name`), `last_name` = VALUES(`last_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

SET FOREIGN_KEY_CHECKS = 1;
