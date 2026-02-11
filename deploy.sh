#!/bin/bash

# Скрипт развертывания Zap Messenger для Debian 12
set -e

echo "--- Настройка Zap Messenger на Debian 12 ---"

# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка зависимостей
sudo apt install -y curl build-essential git postgresql postgresql-contrib nginx certbot python3-certbot-nginx

# Установка Node.js 20 LTS
if ! [ -x "$(command -v node)" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Установка PM2
sudo npm install -g pm2

# Клонирование репозитория
if [ -d "Zap" ]; then
    echo "Директория Zap уже существует. Обновляем из git..."
    cd Zap
    git pull
else
    git clone https://github.com/Mandarln4ik/Zap.git
    cd Zap
fi

# Настройка Backend
echo "Настройка сервера..."
cd server
npm install

# Создание .env если его нет
if [ ! -f ".env" ]; then
    echo "Создание .env файла..."
    read -p "Введите пароль для PostgreSQL: " DB_PASS
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$DB_PASS';" || true
    sudo -u postgres psql -c "CREATE DATABASE messenger_db;" || true
    
    cat <<EOF > .env
DATABASE_URL="postgresql://Zap:S721hsaqwSf_uanfq!@148.253.208.189:5432/Zap_db?schema=public"
JWT_ACCESS_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
PORT=5000
EOF
fi

# Применение миграций Prisma
npx prisma db push

# Сборка Backend
npm run build

# Запуск бэкенда через PM2
pm2 delete zap-api || true
pm2 start dist/index.js --name zap-api

# Настройка Frontend
echo "Настройка клиента..."
cd ../client
npm install

# Создание .env для фронтенда
cat <<EOF > .env
VITE_API_URL="/api"
VITE_WS_URL=""
EOF

npm run build

# Настройка Nginx
echo "Настройка Nginx..."
read -p "Введите ваш домен (или IP): " DOMAIN

sudo cat <<EOF > /etc/nginx/sites-available/zap
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root $(pwd)/dist;
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
        alias $(pwd)/../server/uploads/;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/zap /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "--- Развертывание завершено! ---"
echo "Приложение доступно по адресу: http://$DOMAIN"
