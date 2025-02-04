#!/bin/bash

# 颜色输出函数
print_step() {
    echo -e "\033[1;34m===> $1\033[0m"
}
print_error() {
    echo -e "\033[1;31mError: $1\033[0m"
}
print_success() {
    echo -e "\033[1;32mSuccess: $1\033[0m"

}

check_wsl() {
    print_step "Checking WSL environment..."
    
    # 多种检查方法
    if [ -n "$WSL_DISTRO_NAME" ] || # 检查 WSL 环境变量
       [ -f /proc/sys/fs/binfmt_misc/WSLInterop ] || # 检查 WSL 特定文件
       uname -r | grep -q "WSL" || # 检查内核版本
       [ -n "$WSLENV" ]; then # 检查 WSL 环境变量
        print_success "WSL environment detected"
        return 0
    else
        print_error "This script must be run in WSL"
        return 1
    fi
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        return 1
    fi
    return 0
}

# 等待服务就绪
wait_for_service() {
    local service=$1
    local check_command=$2
    local timeout=$3
    local interval=5
    local elapsed=0

    print_step "Waiting for $service to be ready..."
    while [ $elapsed -lt $timeout ]; do
        if eval "$check_command" &>/dev/null; then
            print_success "$service is ready"
            return 0
        fi
        print_step "$elapsed/$timeout seconds elapsed, $service not ready yet..."
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    print_error "$service failed to start after $timeout seconds"
    return 1
}

# 检查 Docker 环境
check_docker() {
    if docker compose version &> /dev/null; then
        if groups | grep -q docker; then
            print_success "Docker ready to use"
            return 0
        fi
    fi

    print_step "Need to install/configure Docker..."
    if ! sudo -v; then
        print_error "Sudo privileges required for Docker installation"
        exit 1
    fi
    
    return 1
}

# 安装 Docker
setup_docker() {
    if ! check_docker; then
        print_step "Installing Docker..."
        sudo apt update
        sudo apt install -y docker.io docker-compose-plugin
        sudo usermod -aG docker $USER
        
        # 等待 Docker 安装完成
        if ! wait_for_service "Docker installation" "service docker status | grep -q 'active (running)'" 120; then
            print_error "Docker installation failed"
            exit 1
        fi
        
        newgrp docker
    fi
}

# 等待 Docker 服务就绪
wait_for_docker() {
    print_step "Waiting for Docker to be ready..."
    if ! wait_for_service "Docker" "docker ps" 60; then
        print_error "Docker service failed to start"
        exit 1
    fi
}

# 修改配置文件
setup_config() {
    print_step "Modifying configuration files..."
    
    # 修改 package.json
    sed -i 's/"dev:frontend": "vite"/"dev:frontend": "vite --host"/' package.json
    
    # 修改 docker-compose.yml
    sed -i '/volumes:/,/networks:/c\    volumes:\n      - ./.vscode:/usr/src/app/.vscode\n      - ./assets:/usr/src/app/assets\n      - ./convex:/usr/src/app/convex\n      - ./data:/usr/src/app/data\n      - ./public:/usr/src/app/public\n      - ./src:/usr/src/app/src\n      - ./package.json:/usr/src/app/package.json\n      - ./README.md:/usr/src/app/README.md\n      - convex_data:/usr/src/app/convex-local-storage\n    networks:' docker-compose.yml
    
    # 添加 volumes 定义
    if ! grep -q "^volumes:" docker-compose.yml; then
        echo -e "\nvolumes:\n  convex_data:" >> docker-compose.yml
    fi
    
    # # 修改 llm.ts 中的配置
    # sed -i '/\/\* Ollama (local) config:/!b;n;/\*\//d' ./convex/util/llm.ts
    # if ! grep -A 1 "\/\* OpenAI config:" ./convex/util/llm.ts | grep -q "  \*/"; then
    #     sed -i '/\/\* OpenAI config:/a\  */' ./convex/util/llm.ts
    # fi
    # sed -i '/apiKey: () => process.env.OPENAI_API_KEY/!b;n;/\*\//d' ./convex/util/llm.ts
}

 #启动服务
start_services() {
    print_step "Starting services..."
   
    # 清理 ai-town 相关的容器和镜像
    print_step "Cleaning up ai-town containers and images..."
    docker compose down
    docker rm -f $(docker ps -a -q --filter ancestor=ai-town-ai-town) 2>/dev/null || true
    docker rmi ai-town-ai-town 2>/dev/null || true
   
    # 启动容器并等待
    print_step "Starting container..."
    docker compose up --build -d
    if ! wait_for_service "Docker container" "docker compose exec ai-town echo 'Container is ready'" 120; then
        print_error "Container failed to start"
        exit 1
    fi

    # 安装 Convex local backend
    print_step "Installing Convex backend..."
    docker compose exec ai-town bash -c 'curl -L -O https://github.com/get-convex/convex-backend/releases/download/precompiled-2024-06-28-91981ab/convex-local-backend-x86_64-unknown-linux-gnu.zip && \
        unzip convex-local-backend-x86_64-unknown-linux-gnu.zip && \
        rm convex-local-backend-x86_64-unknown-linux-gnu.zip && \
        chmod +x convex-local-backend'
   
    # 等待 convex-local-backend 安装完成
    if ! wait_for_service "Convex backend" "docker compose exec ai-town test -f convex-local-backend" 60; then
        print_error "Convex backend installation failed"
        exit 1
    fi

    # 安装 sqlite3
    print_step "Installing SQLite3..."
    docker compose exec ai-town bash -c 'apt-get update && apt-get install -y sqlite3'

    # 新增：安装 lucide-react
    print_step "Installing lucide-react..."
    docker compose exec ai-town bash -c 'npm install lucide-react'


    print_success "Environment setup completed!"
}

# 设置指引
setup_guide() {
    print_step "Backend Setup Guide"
    echo "Please follow these steps in separate terminals:"
    echo ""
    echo "1. Terminal 1 - Run convex local backend:"
    echo "   docker compose exec ai-town /bin/bash"
    echo "   ./convex-local-backend"
    echo ""
    echo "2. Terminal 2 - Setup Convex and start frontend:"
    echo "   docker compose exec ai-town /bin/bash"
    echo "   just convex dev"
    echo "   # After completion, press Ctrl+C"
    echo "   just convex env set LLM_API_KEY your_openai_api_key"
    echo "   npm run dev:frontend"
    echo ""
    echo "2. Terminal 3 - Start backend service:"
    echo "   docker compose exec ai-town /bin/bash"
    echo "   npm run dev:backend"
}

# 主函数
main() {
    print_step "Starting AI Town setup..."
    
    # 检查是否在 WSL 环境
    if ! check_wsl; then
        exit 1
    fi
    
    # 检查当前目录
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
        print_error "Please run this script in the ai-town directory"
        exit 1
    fi
    
    # 安装和配置 Docker
    setup_docker
    wait_for_docker
    
    # 修改配置文件
    setup_config
    
    # 启动服务
    start_services
    
    # 显示后端设置指引
    setup_guide
    
    print_success "Setup completed!"
    echo "Please follow the setup guide in a new terminal"
}

# 运行主函数
main

