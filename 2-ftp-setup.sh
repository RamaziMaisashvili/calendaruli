#!/bin/bash
# 2. FTP: vsftpd + FTP მომხმარებელი, რომელიც საიტის საქაღალდეშია გამომწყვდეული (chroot)
set -u

if [ "$EUID" -ne 0 ]; then
  echo "გაუშვით sudo-თი: sudo ./2-ftp-setup.sh"
  exit 1
fi

read -r -p "დომენი (საიტი უკვე შექმნილი უნდა იყოს): " DOMAIN
read -r -p "FTP მომხმარებლის სახელი: " FTP_USER
read -r -s -p "პაროლი: " P1; echo
read -r -s -p "გაიმეორეთ პაროლი: " P2; echo

[[ "$FTP_USER" =~ ^[a-z][a-z0-9_]{2,15}$ ]] || { echo "❌ სახელი: პატარა ლათინური ასოები/ციფრები/_ , 3-16 სიმბოლო"; exit 1; }
[ -n "$P1" ] && [ "$P1" = "$P2" ] || { echo "❌ პაროლები ცარიელია ან არ ემთხვევა"; exit 1; }

WEB_ROOT="/var/www/$DOMAIN"
[ -d "$WEB_ROOT/public_html" ] || { echo "❌ $WEB_ROOT/public_html არ არსებობს. ჯერ გაუშვით 1-site-setup.sh"; exit 1; }
id "$FTP_USER" &>/dev/null && { echo "❌ მომხმარებელი უკვე არსებობს"; exit 1; }

# --- vsftpd ინსტალაცია ---
if ! command -v vsftpd >/dev/null; then
  echo "📦 ინსტალდება vsftpd..."
  apt-get update -qq && apt-get install -y vsftpd || { echo "❌ ინსტალაცია ვერ მოხერხდა"; exit 1; }
fi

# nologin შელი უნდა იყოს /etc/shells-ში, თორემ PAM FTP-ს არ მისცემს შესვლას
grep -qx /usr/sbin/nologin /etc/shells || echo /usr/sbin/nologin >> /etc/shells

# --- vsftpd კონფიგურაცია (მხოლოდ პირველად) ---
if ! grep -q "# managed by 2-ftp-setup" /etc/vsftpd.conf 2>/dev/null; then
  echo "⚙️ ეწერება vsftpd.conf (ძველი ინახება .bak-ში)..."
  [ -f /etc/vsftpd.conf ] && cp /etc/vsftpd.conf /etc/vsftpd.conf.bak

  TLS_BLOCK="ssl_enable=NO"
  if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    TLS_BLOCK="ssl_enable=YES
rsa_cert_file=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
rsa_private_key_file=/etc/letsencrypt/live/$DOMAIN/privkey.pem
force_local_logins_ssl=YES
force_local_data_ssl=YES
ssl_tlsv1=NO
ssl_sslv2=NO
ssl_sslv3=NO"
  else
    echo "⚠️ SSL სერტიფიკატი ვერ მოიძებნა: FTP იმუშავებს დაუშიფრავად (პაროლი ღიად გადაიცემა)."
  fi

  cat > /etc/vsftpd.conf <<CONF
# managed by 2-ftp-setup
listen=YES
listen_ipv6=NO
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=002
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
chroot_local_user=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
userlist_enable=YES
userlist_deny=NO
userlist_file=/etc/vsftpd.userlist
pasv_enable=YES
pasv_min_port=40000
pasv_max_port=40100
$TLS_BLOCK
CONF
  touch /etc/vsftpd.userlist
fi

# --- მომხმარებელი ---
echo "👤 იქმნება მომხმარებელი $FTP_USER..."
useradd -M -d "$WEB_ROOT" -s /usr/sbin/nologin -G www-data "$FTP_USER" || exit 1
echo "$FTP_USER:$P1" | chpasswd

# chroot-ის ძირი root-ის საკუთრებაა და დაუწერადია; ჩაწერა მხოლოდ public_html-შია
chown root:root "$WEB_ROOT"
chmod 755 "$WEB_ROOT"
chown -R "$FTP_USER":www-data "$WEB_ROOT/public_html"
chmod 2775 "$WEB_ROOT/public_html"

echo "$FTP_USER" >> /etc/vsftpd.userlist

systemctl enable vsftpd >/dev/null 2>&1
systemctl restart vsftpd

echo "=================================================="
echo "✅ FTP მზადაა"
echo "მომხმარებელი: $FTP_USER"
echo "საქაღალდე:    $WEB_ROOT (ატვირთვა: public_html)"
echo "პორტები გახსენით firewall-ში: 21 და 40000-40100"
echo "შემდეგი ნაბიჯი: sudo ./3-mysql-setup.sh"
echo "=================================================="
