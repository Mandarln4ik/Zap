#!/bin/bash

# Variables
DB_HOST="localhost"
DB_PORT="5432"
DB_USERNAME="zap"
DB_PASSWORD="S721hsaqwSf_uanfq!"
DB_DATABASE="zap_db"
API_PORT="3000"
WEB_PORT="80"

# --- Helper Functions ---
log_info() {
    echo -e "\e[32m[INFO]\e[0m $1"
}

log_warn() {
    echo -e "\e[33m[WARN]\e[0m $1"
}

log_error() {
    echo -e "\e[31m[ERROR]\e[0m $1"
    exit 1
}

check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        log_error "This script must be run as root."
    fi
}

install_dependencies() {
    log_info "Updating package lists..."
    apt update || log_error "Failed to update package lists."

    log_info "Installing common dependencies..."
    apt install -y curl nginx build-essential certbot python3-certbot-nginx || log_error "Failed to install common dependencies."

    log_info "Installing Node.js and npm..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || log_error "Failed to add Node.js PPA."
    apt install -y nodejs || log_error "Failed to install Node.js."

    log_info "Installing pm2..."
    npm install -g pm2 || log_error "Failed to install pm2."

    log_info "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib || log_error "Failed to install PostgreSQL."
    systemctl start postgresql
    systemctl enable postgresql
}

configure_postgresql() {
    log_info "Configuring PostgreSQL..."

    # Check if user exists
    USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename = '$DB_USERNAME'")
    if [ "$USER_EXISTS" != "1" ]; then
        log_info "Creating PostgreSQL user $DB_USERNAME..."
        sudo -u postgres psql -c "CREATE USER $DB_USERNAME WITH PASSWORD '$DB_PASSWORD' SUPERUSER;" || log_error "Failed to create user."
    else
        log_warn "User $DB_USERNAME already exists."
    fi

    # Check if database exists
    DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_DATABASE'")
    if [ "$DB_EXISTS" != "1" ]; then
        log_info "Creating PostgreSQL database $DB_DATABASE..."
        sudo -u postgres psql -c "CREATE DATABASE $DB_DATABASE OWNER $DB_USERNAME;" || log_error "Failed to create database."
    else
        log_warn "Database $DB_DATABASE already exists."
    fi

    # Grant permissions
    log_info "Granting permissions..."
    sudo -u postgres psql -d "$DB_DATABASE" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_DATABASE TO $DB_USERNAME;"
    sudo -u postgres psql -d "$DB_DATABASE" -c "GRANT ALL ON SCHEMA public TO $DB_USERNAME;"
}

deploy_backend() {
    log_info "Deploying backend..."
    cd zap-backend || log_error "Backend directory not found."

    log_info "Installing backend dependencies..."
    npm install --legacy-peer-deps || log_error "Failed to install dependencies."

    log_info "Building backend application..."
    npm run build || log_error "Failed to build application."

    # Environment variables
    cat <<EOF > .env
PORT=$API_PORT
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=$DB_DATABASE
JWT_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 64)
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 64)
JWT_REFRESH_EXPIRES_IN=7d
EOF
    
    log_info "Starting backend with PM2..."
    pm2 delete "zap-backend" &>/dev/null
    PORT=$API_PORT pm2 start dist/src/main.js --name "zap-backend"
    pm2 save
    cd ..
}

deploy_frontend() {
    log_info "Deploying frontend..."
    read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
    if [ -z "$DOMAIN_NAME" ]; then log_error "Domain name is required."; fi

    cd zap-frontend || log_error "Frontend directory not found."
    npm install --legacy-peer-deps || log_error "Failed to install dependencies."
    
    REACT_APP_API_URL="https://$DOMAIN_NAME/api" npm run build || log_error "Build failed."

    rm -rf /var/www/zap-frontend
    cp -r build /var/www/zap-frontend || log_error "Failed to copy build."

    cat <<EOF > /etc/nginx/sites-available/zap-frontend
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    root /var/www/zap-frontend;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:$API_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/zap-frontend /etc/nginx/sites-enabled/zap-frontend
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx

    log_info "Setting up HTTPS..."
    certbot --nginx -d "$DOMAIN_NAME" -d "www.$DOMAIN_NAME" --non-interactive --agree-tos --register-unsafely-without-email --expand
    systemctl restart nginx
    cd ..
}

# --- Main ---
check_root
log_info "Starting Zap Messenger deployment."

PS3="Select option: "
options=("Deploy Server" "Deploy Client" "Deploy All" "Exit")
select opt in "${options[@]}"
do
    case $opt in
        "Deploy Server")
            install_dependencies
            configure_postgresql
            deploy_backend
            break ;;
        "Deploy Client")
            deploy_frontend
            break ;;
        "Deploy All")
            install_dependencies
            configure_postgresql
            deploy_backend
            deploy_frontend
            break ;;
        "Exit") exit 0 ;;
    esac
done

log_info "Done."
