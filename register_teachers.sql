-- ==============================================================
-- Calendar Learn — მასწავლებლების რეგისტრაციის SQL სკრიპტი
-- ყველა მონაცემი იწერება პირდაპირ `api_users` ცხრილში!
-- დეფოლტ პაროლი ყველასთვის: 1234
-- ==============================================================

SET NAMES utf8mb4;

-- 1. api_users ცხრილში email, phone და role სვეტების დამატება (თუ ჯერ არ არის)
ALTER TABLE `api_users` 
  ADD COLUMN IF NOT EXISTS `email` varchar(190) NOT NULL DEFAULT '' AFTER `name`,
  ADD COLUMN IF NOT EXISTS `phone` varchar(50) NOT NULL DEFAULT '' AFTER `email`,
  ADD COLUMN IF NOT EXISTS `role` enum('admin','teacher','student') NOT NULL DEFAULT 'teacher' AFTER `phone`;

-- 2. მასწავლებლების შეყვანა / განახლება პირდაპირ `api_users` ცხრილში (პაროლი: 1234)
INSERT INTO `api_users` (`username`, `name`, `email`, `phone`, `role`, `password_hash`, `is_active`, `failed_attempts`) VALUES
('ludvigi', 'ლუდვიგი ხუხუნაიშვილი', 'Mr.ludvigikhukhunaishvili@gmail.com', '505 557458', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('saba', 'საბა ბაბლუანი', 'Sababablo@gmail.com', '551 07 51 05', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('mariam', 'მარიამ კაკიაშვილი', 'mariam.kakiashvili29@gmail.com', '579 009 247', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('nika_aptsiauri', 'ნიკა აფციაური', 'afciaurinikusha28@gmail.com', '597 61 06 15', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('shota', 'შოთა აბაშიძე', 'shotaabashidze88@gmail.com', '577-033-819', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('kristine', 'ქრისტინე მეგრელიშვილი', 'megrelishvilikristine@gmail.com', '555 16 55 86', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('tornike', 'თორნიკე ბურჯანაძე', 'tornikeburjanadze0@gmail.com', '555462090', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('nika_saladze', 'ნიკა სალაძე', 'SALADZENIKA727@GMAIL.COM', '568 35 65 65', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('giorgi_chitanava', 'გიორგი ჭითანავა', 'tchitanavagiorgi8@gmail.com', '574037389', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('ketevan', 'ქეთევან სალაღოვი', 'salaghoviqeti@gmail.com', '551495777', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('shota_kvaratskhelia', 'შოთა კვარაცხელია', 'shota.kvaratskhelia2018@gmail.com', '596103110', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('khatia', 'ხატია აფრასიძე', 'khatia.aprasidze@weaedu.ge', '599244304', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('nana', 'ნანა ლაბაძე', 'nanallabadze@gmail.com', '599316743', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('enek', 'ენეკ ფრეია პეტერსონი', 'Enek.peterson@gmail.com', '599506427', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('shorena', 'შორენა აბულაძე', 'Shorena1abuladze@gmail.com', '591320075', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('inga_machitadze', 'ინგა მაჩიტაძე', 'i.machitidze1970@gmail.com', '598654243', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('jondo', 'ჯონდო ტალაბაძე', '', '', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('ramazi', 'რამაზი მაისაშვილი', 'maisashvili.ramazi@gmail.com', '577675812', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('nika', 'ნიკა ქობულაძე', 'nikakobuladze7@gmail.com', '598360361', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('nino', 'ნინო დარასელია', '', '', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('giorgi', 'გიორგი სანიკიძე', '', '', 'teacher', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `phone` = VALUES(`phone`),
  `role` = VALUES(`role`),
  `password_hash` = VALUES(`password_hash`),
  `is_active` = 1;
