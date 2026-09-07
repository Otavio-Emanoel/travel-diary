# Guia de Deploy em VPS de Baixo Custo — Diário de Viagens

Este documento apresenta o procedimento completo passo a passo para provisionar e publicar o sistema **Diário de Viagens** em uma VPS de baixo custo ($4 a $10/mês, com 1GB a 2GB de RAM e 1 vCPU, como Hetzner CX22, DigitalOcean Basic ou Linode).

---

## 1. Preparação Inicial do Servidor (Debian / Ubuntu)

### 1.1 Atualização de Pacotes e Criação de Swap
Em servidores com 1GB ou 2GB de RAM, criar um arquivo de **Swap de 2GB** é uma proteção vital contra picos temporários de memória durante builds ou migrações:

```bash
# Atualiza repositórios
sudo apt update && sudo apt upgrade -y

# Cria arquivo swap de 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Torna persistente no fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Ajusta swappiness para usar swap apenas sob extrema necessidade
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### 1.2 Firewall (UFW)
Apenas as portas essenciais devem ficar abertas para a internet pública:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh          # Porta 22
sudo ufw allow http         # Porta 80
sudo ufw allow https        # Porta 443
sudo ufw enable
```

---

## 2. Instalação do Docker e Docker Compose

```bash
# Instala dependências
sudo apt install -y ca-certificates curl gnupg lsb-release

# Adiciona repositório oficial Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instala Docker Engine e plugin Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Habilita inicialização automática
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 3. Implantação da Aplicação

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/travel-diary.git /var/www/travel-diary
cd /var/www/travel-diary

# 2. Criar e preencher arquivo .env de produção
cp .env.example .env
nano .env

# 3. Configurar domínio no Caddyfile
# Editar infrastructure/caddy/Caddyfile substituindo :80 pelo seu domínio:
# seu-dominio.com {
#    ...
# }

# 4. Subir containers via Docker Compose
docker compose up -d --build

# 5. Executar migrações do banco de dados
docker compose exec api pnpm --filter @travel-diary/api drizzle-kit migrate
```

---

## 4. Atualização Contínua e Deploy Sem Queda (*Zero-Downtime Update*)

Para atualizar a versão do sistema após commits no repositório:

```bash
cd /var/www/travel-diary
git pull origin main

# Reconstrói e atualiza apenas os containers modificados
docker compose build api web
docker compose up -d --no-deps api web
docker image prune -f
```
O Caddy segura as conexões HTTP em fila por alguns milissegundos enquanto o novo container sobe, garantindo experiência transparente para os usuários.
