# Planify Backend (Monorepo)

This repository contains all backend microservices for **Planify**, a social planning and event discovery app.

## 🏗️ Project Structure
planify-backend/
├── services/
│ ├── user-service/ # Handles auth, profiles, following
│ ├── plan-service/ # CRUD for plans and joins
│ ├── chat-service/ # Real-time chat using WebSocket + Redis
│ └── notification-service/ # Kafka + FCM notifications
├── shared/ # Common DTOs, utils, constants
├── infra/ # Docker, Terraform, CI/CD configs
└── docker-compose.yml # Infrastructure setup


## ⚙️ Prerequisites
- Node.js v18+
- Docker Desktop (Windows)
- Git
- Postman (optional)

## 🚀 Setup
1. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd planify-backend


2. Start infrastructure:
   ```bash 
   docker compose up -d


3. Run a service:
   ```bash
   cd services/user-service
   npm run start:dev

🧱 Tech Stack

Backend: NestJS (Node.js)

Databases: PostgreSQL, MongoDB

Cache: Redis

Messaging: Kafka

Infra: Docker + Compose

🧠 Note

Never commit .env files or secrets.
Use .env.example instead for reference.
