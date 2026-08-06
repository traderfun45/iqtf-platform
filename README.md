# iqtf-platform
Intelligent Quantitative Trading Framework Platform
## Features

- 📊 **Monorepo** with pnpm + Turborepo
- 🚀 **REST API** with Fastify + Prisma
- 🔌 **WebSocket** for real-time data
- 📈 **Quant Engine** for technical analysis
- 🤖 **AI Engine** for predictions
- 🐳 **Docker** for development
- 🔄 **CI/CD** with GitHub Actions

## Quick Start

```bash
# Clone
git clone https://github.com/your-username/iqtf-platform.git
cd iqtf-platform

# Install
pnpm install

# Setup env
cp .env.example .env

# Start services
docker-compose up -d

# Run migrations
pnpm db:push

# Start dev
pnpm dev
