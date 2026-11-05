-- ==============================================================
-- Calendar Learn — სტუდენტების რეგისტრაციის SQL სკრიპტი
-- ყველა მონაცემი იწერება პირდაპირ `api_users` ცხრილში!
-- დეფოლტ პაროლი ყველასთვის: 1234
-- ==============================================================

SET NAMES utf8mb4;

-- 1. api_users ცხრილში საჭირო სვეტების დამატება (თუ ჯერ არ არის)
ALTER TABLE `api_users` 
  ADD COLUMN IF NOT EXISTS `email` varchar(190) NOT NULL DEFAULT '' AFTER `name`,
  ADD COLUMN IF NOT EXISTS `phone` varchar(50) NOT NULL DEFAULT '' AFTER `email`,
  ADD COLUMN IF NOT EXISTS `personal_id` varchar(50) NOT NULL DEFAULT '' AFTER `phone`,
  ADD COLUMN IF NOT EXISTS `city` varchar(100) NOT NULL DEFAULT '' AFTER `personal_id`,
  ADD COLUMN IF NOT EXISTS `program` varchar(190) NOT NULL DEFAULT '' AFTER `city`,
  ADD COLUMN IF NOT EXISTS `birth_date` varchar(50) NOT NULL DEFAULT '' AFTER `program`,
  ADD COLUMN IF NOT EXISTS `role` enum('admin','teacher','student') NOT NULL DEFAULT 'student' AFTER `birth_date`;

-- 2. 25 სტუდენტის შეყვანა / განახლება პირდაპირ `api_users` ცხრილში (პაროლი: 1234)
INSERT INTO `api_users` (`username`, `name`, `email`, `phone`, `personal_id`, `city`, `program`, `birth_date`, `role`, `password_hash`, `is_active`, `failed_attempts`) VALUES
('diana_sakhuria', 'დიანა სახურია', 'diana_sakhuria@student.ge', '599713639', '48001005823', 'ზუგდიდი', 'Front-end დეველოპმენტი', '1986-04-20', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('tea_akhvlediani', 'თეა ახვლედიანი', 'tea_akhvlediani@student.ge', '593233935', '61006077600', 'ბათუმი', 'Front-end დეველოპმენტი', '1995-12-11', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('nani_giorgidze', 'ნანი გიორგიძე', 'nani_giorgidze@student.ge', '599185712', '09001007427', 'ბაღდათი', 'Front-end დეველოპმენტი', '1958-02-14', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('anna_kapanadze', 'ანნა კაპანაძე', 'anna_kapanadze@student.ge', '555753848/599953915', '35001045450', 'სიღნაღი', 'Front-end დეველოპმენტი', '1985-08-22', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('natia_arsenidze', 'ნათია არსენიძე', 'natia_arsenidze@student.ge', '577904990', '41001015679', 'ხარაგაული', 'Front-end დეველოპმენტი', '1988-12-11', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('simon_abesadze', 'სიმონ აბესაძე', 'simon_abesadze@student.ge', '551691737', '60003003780', 'ბაღდათი', 'Front-end დეველოპმენტი', '1971-12-08', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('nino_shatirishvili', 'ნინო შათირიშვილი', 'nino_shatirishvili@student.ge', '599733556', '60001159470', 'წყალტუბო', 'Front-end დეველოპმენტი', '2001-01-25', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('khatuna_gonashvili', 'ხათუნა გონაშვილი', 'khatuna_gonashvili@student.ge', '599855717', '14001002407', 'დედოფლისწყარო', 'Front-end დეველოპმენტი', '1979-10-24', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('saba_akhalkatsi', 'საბა ახალკაცი', 'saba_akhalkatsi@student.ge', '557490889', '57701065929', 'ხაშური', 'Front-end დეველოპმენტი', '2006-03-04', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('giorgi_mishvelidze', 'გიორგი მიშველიძე', 'giorgi_mishvelidze@student.ge', '551099596', '09901029634', 'ქუთაისი', 'Front-end დეველოპმენტი', '2004-04-23', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('nino_khaduri', 'ნინო ხადური', 'nino_khaduri@student.ge', '577264622', '01019049421', 'გლდანი-ნაძალადევი', 'Front-end დეველოპმენტი', '1988-12-30', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('maiko_qavzharadze', 'მაიკო ქავჟარაძე', 'maiko_qavzharadze@student.ge', '555616142', '01801121078', 'გლდანი-ნაძალადევი', 'Front-end დეველოპმენტი', '2008-01-21', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('irakli_arabidze', 'ირაკლი არაბიძე', 'irakli_arabidze@student.ge', '599374333', '60001157764', 'ქუთაისი', 'Front-end დეველოპმენტი', '1995-03-13', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('megi_grigalashvili', 'მეგი გრიგალაშვილი', 'megi_grigalashvili@student.ge', '598934061', '11001025037', 'ბორჯომი', 'Front-end დეველოპმენტი', '1989-09-23', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('merab_nergadze', 'მერაბ ნერგაძე', 'merab_nergadze@student.ge', '551310133', '09001017348', 'ბაღდათი', 'Front-end დეველოპმენტი', '1989-05-08', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('rati_zivzivadze', 'რატი ზივზივაძე', 'rati_zivzivadze@student.ge', '598877076', '09001024802', 'ბაღდათი', 'Front-end დეველოპმენტი', '1991-05-19', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('rusudan_gabekhadze', 'რუსუდან გაბეხაძე', 'rusudan_gabekhadze@student.ge', '591616811', '09001007708', 'ბაღდათი', 'Front-end დეველოპმენტი', '1976-12-20', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('salome_bitsadze', 'სალომე ბიწაძე', 'salome_bitsadze@student.ge', '593238388', '01017039944', 'ისანი-სამგორი', 'Front-end დეველოპმენტი', '1990-11-12', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('davit_qemkhadze', 'დავით ქემხაძე', 'davit_qemkhadze@student.ge', '591881989', '61001080224', 'დიდუბე-ჩუღურეთი', 'Front-end დეველოპმენტი', '2000-06-05', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('tea_tsulaia', 'თეა წულაია', 'tea_tsulaia@student.ge', '568112319', '48001025266', 'ქობულეთი', 'Front-end დეველოპმენტი', '2002-07-09', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('teimurazi_tolordava', 'თეიმურაზი თოლორდავა', 'teimurazi_tolordava@student.ge', '595038488', '09001028198', 'ბაღდათი', 'Front-end დეველოპმენტი', '1997-12-27', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('anano_nergadze', 'ანანო ნერგაძე', 'anano_nergadze@student.ge', '571095123', '09001026004', 'გლდანი-ნაძალადევი', 'Front-end დეველოპმენტი', '1996-12-30', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('levan_sherozia', 'ლევან შეროზია', 'levan_sherozia@student.ge', '555180236', '01019077229', 'გლდანი-ნაძალადევი', 'Front-end დეველოპმენტი', '2001-01-15', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('luka_akhaladze', 'ლუკა ახალაძე', 'luka_akhaladze@student.ge', '555273362', '09601029677', 'ბაღდათი', 'Front-end დეველოპმენტი', '2004-07-27', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0),
('tariel_ebanoidze', 'ტარიელ ებანოიძე', 'tariel_ebanoidze@student.ge', '598654363', '09001024856', 'ბაღდათი', 'Front-end დეველოპმენტი', '1991-10-02', 'student', 'scrypt$597383f0469666c64e5a453dc0b488fa$af4075b2b953ec095522c5cd1c22831f91cfc3b7062d20a6d1247aa1818c1bd636dc7b97af14eaf20ab2b1218d6552bbd2bc23bbe716667e68d97c41682b889d', 1, 0)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `phone` = VALUES(`phone`),
  `personal_id` = VALUES(`personal_id`),
  `city` = VALUES(`city`),
  `program` = VALUES(`program`),
  `birth_date` = VALUES(`birth_date`),
  `role` = VALUES(`role`),
  `password_hash` = VALUES(`password_hash`),
  `is_active` = 1;
