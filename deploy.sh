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

    log_info "Installing common dependencies: curl, nginx, build-essential..."
    apt install -y curl nginx build-essential || log_error "Failed to install common dependencies."

    log_info "Installing Node.js and npm..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || log_error "Failed to add Node.js PPA."
    apt install -y nodejs || log_error "Failed to install Node.js."

    log_info "Installing pm2..."
    npm install -g pm2 || log_error "Failed to install pm2."

    log_info "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib || log_error "Failed to install PostgreSQL."
}

configure_postgresql() {
    log_info "Configuring PostgreSQL..."

    # Prompt for DB credentials
    read -p "Enter PostgreSQL username (default: postgres): " input_db_username
    DB_USERNAME=${input_db_username:-$DB_USERNAME}
    read -s -p "Enter PostgreSQL password (default: postgres): " input_db_password
    DB_PASSWORD=${input_db_password:-$DB_PASSWORD}
    echo
    read -p "Enter PostgreSQL database name (default: zap_messenger): " input_db_database
    DB_DATABASE=${input_db_database:-$DB_DATABASE}

    # Check if user exists, create if not
    if ! su - postgres -c "psql -tAc \"SELECT 1 FROM pg_user WHERE usename = '$DB_USERNAME'\"" &>/dev/null; then
        log_info "Creating PostgreSQL user \'$DB_USERNAME\'..."
        su - postgres -c "createuser -s -d \"$DB_USERNAME\"" || log_error "Failed to create PostgreSQL user."
        su - postgres -c "psql -c \"ALTER USER \"$DB_USERNAME\" WITH PASSWORD \'$DB_PASSWORD\'\"" || log_error "Failed to set password for PostgreSQL user."
    else
        log_warn "PostgreSQL user \'$DB_USERNAME\' already exists. Skipping creation."
    fi

    # Check if database exists, create if not
    if ! su - postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname = '$DB_DATABASE'\"" &>/dev/null; then
        log_info "Creating PostgreSQL database \'$DB_DATABASE\'..."
        su - postgres -c "createdb -O \"$DB_USERNAME\" \"$DB_DATABASE\"" || log_error "Failed to create PostgreSQL database."
    else
        log_warn "PostgreSQL database \'$DB_DATABASE\' already exists. Skipping creation."
    fi
}

deploy_backend() {
    log_info "Deploying backend..."

    # Navigate to backend directory
    cd zap-backend || log_error "Backend directory not found."

    # Install dependencies
    log_info "Installing backend dependencies..."
    npm install --legacy-peer-deps || log_error "Failed to install backend dependencies."

    # Build NestJS app
    log_info "Building backend application..."
    npm run build || log_error "Failed to build backend application."

    # Verify build
    if [ ! -f "dist/src/main.js" ]; then
        log_error "Build failed: dist/src/main.js not found."
    fi

    # Setup environment variables for PM2
    echo "PORT=$API_PORT" > .env
    echo "DB_HOST=$DB_HOST" >> .env
    echo "DB_PORT=$DB_PORT" >> .env
    echo "DB_USERNAME=$DB_USERNAME" >> .env
    echo "DB_PASSWORD=$DB_PASSWORD" >> .env
    echo "DB_DATABASE=$DB_DATABASE" >> .env
    echo "JWT_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 64)" >> .env
    echo "JWT_EXPIRES_IN=1d" >> .env
    echo "JWT_REFRESH_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 64)" >> .env
    echo "JWT_REFRESH_EXPIRES_IN=7d" >> .env
    
    log_info "Starting backend with PM2..."
    pm2 delete "zap-backend" &>/dev/null
    pm2 start dist/src/main.js --name "zap-backend" --env production || log_error "Failed to start backend with PM2."
    pm2 save || log_error "Failed to save PM2 configuration."
    
    cd ..
}

deploy_frontend() {
    log_info "Deploying frontend..."

    # Navigate to frontend directory
    cd zap-frontend || log_error "Frontend directory not found."

    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm install --legacy-peer-deps || log_error "Failed to install frontend dependencies."

    # Build React app
    log_info "Building frontend application..."
    # Set REACT_APP_API_URL during build for production
    REACT_APP_API_URL="http://localhost:$API_PORT" npm run build || log_error "Failed to build frontend application."

    # Configure Nginx
    log_info "Configuring Nginx for frontend..."
    cp -r build /var/www/zap-frontend || log_error "Failed to copy frontend build files."

    cat <<EOF > /etc/nginx/sites-available/zap-frontend
server {
    listen $WEB_PORT;
    server_name your_domain.com www.your_domain.com; # Change to your domain

    root /var/www/zap-frontend;
    index index.html index.htm;

    location / {
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:$API_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable Nginx site
    ln -sf /etc/nginx/sites-available/zap-frontend /etc/nginx/sites-enabled/zap-frontend || log_error "Failed to enable Nginx site."
    rm -f /etc/nginx/sites-enabled/default # Remove default nginx site

    log_info "Testing Nginx configuration..."
    nginx -t || log_error "Nginx configuration test failed."

    log_info "Restarting Nginx..."
    systemctl restart nginx || log_error "Failed to restart Nginx."
    systemctl enable nginx || log_error "Failed to enable Nginx to start on boot."
    
    cd ..
}

# --- Main Script ---
check_root

log_info "Starting Zap Messenger deployment script."

if [ -n "$1" ]; then
    case "$1" in
        "server")
            log_info "Selected: Deploying Server (DB + API)"
            install_dependencies
            configure_postgresql
            deploy_backend
            log_info "Server deployment complete."
            ;;
        "client")
            log_info "Selected: Deploying Client (UI + Nginx)"
            deploy_frontend
            log_info "Client deployment complete."
            ;;
        "all")
            log_info "Selected: Deploying All (DB + API + UI + Nginx)"
            install_dependencies
            configure_postgresql
            deploy_backend
            deploy_frontend
            log_info "Full deployment complete."
            ;;
        *)
            log_error "Invalid argument: $1. Use 'server', 'client', or 'all'."
            ;;
    esac
else
    PS3="Select deployment option: "
    options=("Deploy_Server (DB + API)" "Deploy_Client (UI + Nginx)" "Deploy_All" "Exit")
    select opt in "${options[@]}"
    do
        case $opt in
            "Deploy_Server (DB + API)")
                log_info "Selected: Deploying Server (DB + API)"
                install_dependencies
                configure_postgresql
                deploy_backend
                log_info "Server deployment complete."
                break
                ;;
            "Deploy_Client (UI + Nginx)")
                log_info "Selected: Deploying Client (UI + Nginx)"
                deploy_frontend
                log_info "Client deployment complete."
                break
                ;;
            "Deploy_All")
                log_info "Selected: Deploying All (DB + API + UI + Nginx)"
                install_dependencies
                configure_postgresql
                deploy_backend
                deploy_frontend
                log_info "Full deployment complete."
                break
                ;;
            "Exit")
                log_info "Exiting deployment script."
                exit 0
                ;;
            *)
                log_error "Invalid option $REPLY"
                ;;
        esac
    done
fi

log_info "Deployment script finished."
