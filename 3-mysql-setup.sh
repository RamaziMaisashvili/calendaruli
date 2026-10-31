#!/bin/bash
# 3. MySQL: ბაზა + მომხმარებელი (მხოლოდ ამ ბაზაზე უფლებებით)
set -u

if [ "$EUID" -ne 0 ]; then
  echo "გაუშვით sudo-თი: sudo ./3-mysql-setup.sh"
  exit 1
fi

command -v mysql >/dev/null || { echo "❌ mysql ვერ მოიძებნა (apt install mysql-server)"; exit 1; }

read -r -p "ბაზის სახელი: " DB_NAME
read -r -p "ბაზის მომხმარებელი (მაქს. 32 სიმბოლო): " DB_USER
read -r -s -p "პაროლი (ცარიელი = ავტომატურად დაგენერირდება): " DB_PASS; echo

[[ "$DB_NAME" =~ ^[A-Za-z][A-Za-z0-9_]{0,63}$ ]] || { echo "❌ ბაზის სახელი: ლათინური ასოები/ციფრები/_"; exit 1; }
[[ "$DB_USER" =~ ^[A-Za-z][A-Za-z0-9_]{0,31}$ ]] || { echo "❌ მომხმარებლის სახელი: ლათინური ასოები/ციფრები/_"; exit 1; }

GENERATED=0
if [ -z "$DB_PASS" ]; then
  DB_PASS=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)
  GENERATED=1
fi

# SQL-ში უსაფრთხოდ ჩასასმელად: ვაექსეიფებთ \ და '
ESC_PASS=${DB_PASS//\\/\\\\}
ESC_PASS=${ESC_PASS//\'/\'\'}

EXISTS=$(mysql -u root -N -B -e "SELECT COUNT(*) FROM mysql.user WHERE user='$DB_USER' AND host='localhost';")
[ "$EXISTS" != "0" ] && { echo "❌ მომხმარებელი '$DB_USER' უკვე არსებობს"; exit 1; }

echo "🗄️ იქმნება ბაზა და მომხმარებელი..."
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '$DB_USER'@'localhost' IDENTIFIED BY '$ESC_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

if [ $? -eq 0 ]; then
  echo "=================================================="
  echo "✅ MySQL მზადაა"
  echo "ბაზა:         $DB_NAME"
  echo "მომხმარებელი: $DB_USER"
  [ "$GENERATED" = 1 ] && echo "პაროლი:       $DB_PASS   (ჩაიწერეთ, მეორედ აღარ გამოჩნდება)"
  echo "ჰოსტი:        localhost"
  echo "=================================================="
else
  echo "❌ MySQL-ის შეცდომა"
  exit 1
fi
