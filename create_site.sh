#!/usr/bin/env bash
# Ubuntu LAMP: account + public_html + SFTP + database prefix grants.
# Does not change Apache virtual hosts, installed runtimes or existing accounts.
set -Eeuo pipefail
umask 077
[[ $EUID == 0 ]] || { echo 'გაუშვი sudo bash create_site.sh'; exit 1; }
fail(){ echo "შეცდომა: $*" >&2; exit 1; }
for c in python3 getent useradd chpasswd sshd systemctl mariadb flock stat; do
 command -v "$c" >/dev/null || fail "ბრძანება ვერ მოიძებნა: $c"
done
exec 9>/run/lock/create-site.lock
flock -n 9 || fail 'სხვა გაშვება მუშაობს.'
sshd -t
mariadb --batch --skip-column-names -e 'SELECT 1' >/dev/null
read -r -p 'საიტის სახელი (მაგ.: portfolio): ' name
[[ $name =~ ^[a-z][a-z0-9-]{0,62}$ ]] || fail 'გამოიყენე პატარა ლათინური ასოები, ციფრები და დეფისი.'
read -r -p 'დომენი (მაგ.: portfolio.learn.net.ge): ' domain
[[ $domain =~ ^[a-z0-9][a-z0-9.-]+\.[a-z]{2,63}$ && $domain != *..* ]] || fail 'დომენი არასწორია.'
base=/var/www/html
site="$base/$domain"
public="$site/public_html"
for p in /var /var/www; do
 [[ -d $p && ! -L $p ]] || fail "$p უნდა იყოს ჩვეულებრივი საქაღალდე."
 [[ $(stat -c %u "$p") == 0 ]] || fail "SFTP chroot-ისთვის $p root-ს უნდა ეკუთვნოდეს. არსებული მფლობელი ავტომატურად არ შეიცვლება."
 mode=$(stat -c %a "$p"); (( (8#$mode & 0022) == 0 )) || fail "$p ჯგუფისთვის/სხვებისთვის ჩაწერადია."
done
[[ -d $base && ! -L $base ]] || fail "$base უნდა არსებობდეს და არ იყოს სიმბოლური ბმული."
[[ ! -e $site ]] || fail "$site უკვე არსებობს. ფაილები არ შეცვლილა; არსებული საიტის გადაფორმება ცალკე უნდა გაკეთდეს."
user=''
for attempt in 1 2 3; do
 candidate=$(python3 - "$name" "$attempt" <<'PY'
import sys,secrets,string
s=sys.argv[1].replace('-','')
if sys.argv[2]=='1': print((s+'siteuser')[:8])
else: print((s+'site')[:4]+''.join(secrets.choice(string.ascii_lowercase+string.digits) for _ in range(4)))
PY
)
 if ! getent passwd "$candidate" >/dev/null && ! getent group "$candidate" >/dev/null && [[ $(mariadb -NBe "SELECT COUNT(*) FROM mysql.user WHERE User='$candidate'") == 0 ]]; then user=$candidate; break; fi
done
if [[ -z $user ]]; then
 read -r -p 'სამი სახელი დაკავებულია. მიუთითე ახალი სახელი (8 სიმბოლო): ' user
 [[ $user =~ ^[a-z][a-z0-9]{7}$ ]] || fail 'საჭიროა 8 სიმბოლო.'
 ! getent passwd "$user" >/dev/null && ! getent group "$user" >/dev/null || fail 'სახელი დაკავებულია.'
 [[ $(mariadb -NBe "SELECT COUNT(*) FROM mysql.user WHERE User='$user'") == 0 ]] || fail 'ბაზის მომხმარებელი უკვე არსებობს.'
fi
password=$(python3 -c 'import secrets; print(secrets.token_hex(16))')
dbpassword=$(python3 -c 'import secrets; print(secrets.token_hex(16))')
port=$(sshd -T | awk '$1=="port"{print $2;exit}')
printf 'საქაღალდე: %s\nმომხმარებელი: %s\nბაზების პრეფიქსი: %s_\n' "$public" "$user" "$user"
read -r -p 'შევქმნა? [y/N]: ' ok
[[ $ok == y || $ok == Y ]] || exit 0
credentials=/var/www/.site-credentials
[[ ! -L $credentials ]] || fail 'პაროლების საქაღალდე სიმბოლური ბმული არ უნდა იყოს.'
install -d -o root -g root -m 0700 "$credentials"
record=$(mktemp "$credentials/site-credentials-XXXXXXXX.txt")
chmod 600 "$record"
cp -p /etc/ssh/sshd_config "$record.ssh-backup"
trap 'echo "შეცდომაზე პროცესი გაჩერდა. მონაცემები და SSH ასლი: $record. უკვე შექმნილი ფაილები არ იშლება." >&2' ERR
printf 'Domain: %s\nFolder: %s\nSFTP host: %s\nSFTP port: %s\nSFTP user: %s\nSFTP password: %s\nSFTP path: /public_html\nDB host: 127.0.0.1\nDB user: %s\nDB password: %s\nDB prefix: %s_\n' "$domain" "$public" "$domain" "$port" "$user" "$password" "$user" "$dbpassword" "$user" > "$record"
chown root:root "$base"
chmod 755 "$base"
useradd --user-group --no-create-home --home-dir /public_html --shell /usr/sbin/nologin --groups www-data "$user"
install -d -o root -g root -m 755 "$site"
install -d -o "$user" -g www-data -m 2750 "$public"
printf '%s:%s\n' "$user" "$password" | chpasswd
# Underscore is escaped: only this exact prefix is granted. No global privileges.
mariadb <<SQL
CREATE USER '$user'@'localhost' IDENTIFIED BY '$dbpassword';
CREATE USER '$user'@'127.0.0.1' IDENTIFIED BY '$dbpassword';
GRANT ALL PRIVILEGES ON \`${user}\\_%\`.* TO '$user'@'localhost';
GRANT ALL PRIVILEGES ON \`${user}\\_%\`.* TO '$user'@'127.0.0.1';
CREATE DATABASE \`${user}_main\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL
cat >> /etc/ssh/sshd_config <<SSH

# Site account: $domain
Match User $user
    ChrootDirectory $site
    ForceCommand internal-sftp -d /public_html -u 0027
    PasswordAuthentication yes
    AuthenticationMethods password
    DisableForwarding yes
    PermitTTY no
Match all
SSH
if ! sshd -t; then
 cp -p "$record.ssh-backup" /etc/ssh/sshd_config
 fail 'SSH ცვლილება გაუქმდა. ანგარიში და საქაღალდე შექმნილია; ნახე მონაცემების ფაილი.'
fi
effective=$(sshd -T -C "user=$user,host=$domain,addr=127.0.0.1")
if ! grep -Fxq "chrootdirectory $site" <<< "$effective" || ! grep -Fxq 'forcecommand internal-sftp -d /public_html -u 0027' <<< "$effective"; then
 cp -p "$record.ssh-backup" /etc/ssh/sshd_config
 fail 'არსებული SSH წესი კონფლიქტშია. SSH ცვლილება გაუქმდა.'
fi
systemctl reload ssh
unset password dbpassword
printf '\nშეიქმნა. პაროლების ფაილი: %s\nსანახავად: sudo cat %s\nწასაშლელად: sudo rm -- %s\n' "$record" "$record" "$record"
echo 'Apache-ის დომენის მიბმა ამ სკრიპტში არ იცვლება.'
