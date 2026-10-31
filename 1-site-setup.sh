#!/bin/bash
# 1. საიტის შექმნა: საქაღალდეები + Apache ვირტუალური ჰოსტი (+ არასავალდებულო HTTPS)
set -u

if [ "$EUID" -ne 0 ]; then
  echo "გაუშვით sudo-თი: sudo ./1-site-setup.sh"
  exit 1
fi

read -r -p "დომენი (მაგ: mysite.com): " DOMAIN
[[ "$DOMAIN" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$ ]] || { echo "❌ არასწორი დომენი"; exit 1; }

WEB_ROOT="/var/www/$DOMAIN"
CONF="/etc/apache2/sites-available/$DOMAIN.conf"

if [ -e "$CONF" ] || [ -d "$WEB_ROOT" ]; then
  echo "❌ ეს საიტი უკვე არსებობს ($CONF ან $WEB_ROOT)"
  exit 1
fi

read -r -p "დაემატოს www.$DOMAIN alias? [y/N]: " WITH_WWW

echo "📁 იქმნება საქაღალდეები..."
mkdir -p "$WEB_ROOT/public_html"
chown root:root "$WEB_ROOT"
chmod 755 "$WEB_ROOT"
chown www-data:www-data "$WEB_ROOT/public_html"
chmod 2775 "$WEB_ROOT/public_html"

cat > "$WEB_ROOT/public_html/index.html" <<HTML
<!DOCTYPE html>
<html lang="ka">
<head><meta charset="UTF-8"><title>$DOMAIN</title></head>
<body><h1>საიტი $DOMAIN მუშაობს!</h1></body>
</html>
HTML

ALIAS_LINE=""
[[ "$WITH_WWW" =~ ^[yY]$ ]] && ALIAS_LINE="ServerAlias www.$DOMAIN"

echo "🌐 იქმნება Apache კონფიგურაცია..."
cat > "$CONF" <<VHOST
<VirtualHost *:80>
    ServerAdmin webmaster@$DOMAIN
    ServerName $DOMAIN
    $ALIAS_LINE
    DocumentRoot $WEB_ROOT/public_html

    ErrorLog \${APACHE_LOG_DIR}/$DOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$DOMAIN-access.log combined

    <Directory $WEB_ROOT/public_html>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
VHOST

a2enmod rewrite >/dev/null
a2ensite "$DOMAIN.conf" >/dev/null

if apache2ctl configtest 2>&1 | grep -q "Syntax OK"; then
  systemctl reload apache2
  echo "✅ Apache-ს კონფიგურაცია ჩაირთო"
else
  echo "❌ Apache-ს კონფიგურაციის შეცდომა:"
  apache2ctl configtest
  a2dissite "$DOMAIN.conf" >/dev/null
  exit 1
fi

# --- HTTPS (არასავალდებულო) ---
HTTPS_STATUS="არ ჩართულა"
read -r -p "მივიღოთ Let's Encrypt SSL სერტიფიკატი ახლავე? [y/N]: " WANT_SSL
if [[ "$WANT_SSL" =~ ^[yY]$ ]]; then
  read -r -p "ელფოსტა (ვადის გასვლის შეტყობინებებისთვის): " EMAIL
  DOMAINS=(-d "$DOMAIN")
  [[ "$WITH_WWW" =~ ^[yY]$ ]] && DOMAINS+=(-d "www.$DOMAIN")
  if certbot --apache "${DOMAINS[@]}" --non-interactive --agree-tos -m "$EMAIL" --redirect; then
    HTTPS_STATUS="ჩართულია"
  else
    HTTPS_STATUS="შეცდომა: შეამოწმეთ A record და პორტები 80/443"
  fi
fi

echo "=================================================="
echo "📍 საქაღალდე: $WEB_ROOT/public_html"
echo "🔒 HTTPS: $HTTPS_STATUS"
echo "შემდეგი ნაბიჯი: sudo ./2-ftp-setup.sh"
echo "=================================================="
