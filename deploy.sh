#!/bin/sh

# Скрипт развертывания Zap Messenger для Debian 12
# Должен запускаться от root или через sudo

set -e

# Проверка на root через команду id (более совместимо чем $EUID)
if [ "$(id -u)" -ne 0 ]; then
  echo "Пожалуйста, запустите скрипт от root (через sudo)."
  exit 1
fi

echo "--- Настройка Zap Messenger на Debian 12 ---"

# Создание пользователя Zap, если его нет
if ! id "Zap" >/dev/null 2>&1; then
    echo "Создание системного пользователя Zap..."
    useradd -m -s /bin/bash Zap
else
    echo "Пользователь Zap уже существует."
fi

# Обновление списка пакетов
apt update

# Установка системных зависимостей
apt install -y curl build-essential git postgresql postgresql-contrib nginx certbot python3-certbot-nginx sudo

# Установка Node.js 20 LTS
if ! command -v node >/dev/null 2>&1; then
    echo "Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "Node.js уже установлен ($(node -v))."
fi

# Установка PM2 глобально
if ! command -v pm2 >/dev/null 2>&1; then
    echo "Установка PM2..."
    npm install -g pm2
else
    echo "PM2 уже установлен."
fi

# Путь установки
INSTALL_DIR="/home/Zap/messenger"
mkdir -p "$INSTALL_DIR"
chown Zap:Zap "$INSTALL_DIR"

# Переключаемся в директорию установки
cd "$INSTALL_DIR"

# Клонирование репозитория от имени пользователя Zap
if [ ! -d ".git" ]; then
    sudo -u Zap git clone https://github.com/Mandarln4ik/Zap.git .
else
    echo "Репозиторий уже клонирован, обновляем..."
    sudo -u Zap git pull
fi

# Настройка Backend
echo "Настройка сервера..."
cd server
sudo -u Zap npm install

# Создание .env если его нет
if [ ! -f ".env" ]; then
    echo "--- Конфигурация базы данных ---"
    echo "Пожалуйста, убедитесь, что база данных уже создана в PostgreSQL."
    printf "Введите имя пользователя БД: "
    read DB_USER
    printf "Введите пароль пользователя БД: "
    read DB_PASS
    printf "Введите название базы данных: "
    read DB_NAME
    printf "Введите хост БД (по умолчанию localhost): "
    read DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    sudo -u Zap tee .env > /dev/null <<EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:5432/$DB_NAME?schema=public"
JWT_ACCESS_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
PORT=5000
EOF
fi

# Применение миграций Prisma
sudo -u Zap npx prisma db push

# Сборка Backend
sudo -u Zap npm run build

# Запуск бэкенда через PM2 от имени Zap
sudo -u Zap pm2 delete zap-api >/dev/null 2>&1 || true
sudo -u Zap pm2 start dist/index.js --name zap-api
sudo -u Zap pm2 save

# Настройка автозапуска PM2
# Используем команду напрямую, так как startup возвращает команду для выполнения
PM2_STARTUP=$(sudo -u Zap pm2 startup systemd -u Zap --hp /home/Zap | grep "sudo env")
if [ -n "$PM2_STARTUP" ]; then
    eval "$PM2_STARTUP"
fi

# Настройка Frontend
echo "Настройка клиента..."
cd ../client
sudo -u Zap npm install

# Создание .env для фронтенда
sudo -u Zap tee .env > /dev/null <<EOF
VITE_API_URL="/api"
VITE_WS_URL=""
EOF

sudo -u Zap npm run build

# Настройка Nginx
echo "Настройка Nginx..."
printf "Введите ваш домен (или IP): "
read DOMAIN

cat <<EOF > /etc/nginx/sites-available/zap
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root $INSTALL_DIR/client/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
    }

    location /uploads/ {
        alias $INSTALL_DIR/server/uploads/;
    }
}
EOF

ln -sf /etc/nginx/sites-available/zap /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "--- Развертывание завершено! ---"
echo "Приложение запущено от пользователя Zap."
echo "Доступно по адресу: http://$DOMAIN"
