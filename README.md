# NitroPing 🚀

> Self-hosted push notification service built with Nuxt 4 & Nitro

[![Docker Pulls](https://img.shields.io/docker/pulls/productdevbook/nitroping.svg)](https://hub.docker.com/r/productdevbook/nitroping)
[![Docker Image Size](https://img.shields.io/docker/image-size/productdevbook/nitroping/latest.svg)](https://hub.docker.com/r/productdevbook/nitroping)

[![Version](https://img.shields.io/npm/v/nitroping.svg)](https://npmjs.org/package/nitroping)
[![License](https://img.shields.io/npm/l/nitroping.svg)](https://github.com/productdevbook/nitroping/blob/main/LICENSE)

## 🤗 Open to Everything!

**This project is completely open to all contributions, ideas, and structural changes!** Whether you want to suggest a different tech stack, propose architectural changes, or completely rethink the approach - all feedback and contributions are welcome. We're in the early stages and want to build this together with the community.

## 🎯 Vision

NitroPing is an open-source, self-hosted push notification service that puts you in control of your messaging infrastructure. Built with modern web technologies, it provides a clean, efficient alternative to proprietary push notification services.

## ✨ Planned Features

- 📱 **Multi-Platform Support**: iOS (APNs), Android (FCM), Web Push
- 🏗️ **Modern Stack**: Nuxt 4, Nitro, GraphQL APIs
- 🔒 **Self-Hosted**: Complete control over your data and infrastructure  
- 🌐 **GraphQL API**: Type-safe, efficient API layer
- 📊 **Analytics**: Delivery tracking and performance metrics
- 🔄 **Real-time**: WebSocket support for instant updates
- 🛡️ **Security**: Built-in authentication and rate limiting
- 📦 **Easy Deploy**: Docker support and simple configuration

## 🚧 Development Status

This project is in early development. We're building something special - a push notification service that developers will love to use and deploy.

## 🛠️ Tech Stack

- **Framework**: Nuxt 4
- **Server**: Nitro
- **API**: [Nitro GraphQL](https://github.com/productdevbook/nitro-graphql)
- **Database**: TBD (PostgreSQL/SQLite support planned)
- **Queue**: TBD (Redis/BullMQ planned)

## 🎨 Why NitroPing?

- **Developer First**: Clean APIs, great DX, extensive documentation
- **Performance**: Built on Nitro for maximum efficiency
- **Flexibility**: Support for multiple notification providers
- **Privacy**: Self-hosted means your data stays yours
- **Open Source**: MIT licensed, community-driven

## 🤝 Contributing

We're just getting started! This is the perfect time to get involved:

- 💡 Share ideas and feedback
- 🐛 Report issues (when we have some code to break)
- 📝 Improve documentation
- 🧑‍💻 Submit pull requests

## 📬 Stay Updated

Watch this repo for updates as we build NitroPing from the ground up. We'll be sharing our progress and looking for feedback from the community.

## 🚀 Quick Start

### Environment Setup

1. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

2. **Generate required secrets**
   
   **JWT Secret** (for API authentication):
   ```bash
   # Option 1: Using Node.js
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Option 2: Using OpenSSL
   openssl rand -hex 64
   
   # Option 3: Using online generator
   # Visit: https://generate-secret.vercel.app/64
   ```

   **Webhook Secret** (for delivery callbacks):
   ```bash
   # Option 1: Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Option 2: Using OpenSSL
   openssl rand -hex 32
   ```

3. **Set up database**
   ```bash
   # Start PostgreSQL (using Docker)
   docker run --name nitroping-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nitroping -p 5432:5432 -d postgres:15
   
   # Generate and run migrations
   pnpm db:generate
   pnpm db:migrate
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```
   
#### Docker
If you prefer Docker, you can run NitroPing in a containerized environment. Make sure to set up the `.env` file with the necessary secrets and database connection details.

If running Docker compose for the first time, migration is needed. Run the docker compose with `migrate` profile to set up the database schema. 

```bash
docker compose up --profile migrate --profile dev -d 
```
For subsequent runs, you can use the `dev` profile to start the application without migrating again.

```bash
docker compose up --profile dev -d
```
For production deployments, you can use the `prod` profile to run the application in production mode.

```bash
docker compose up --profile prod -d
```

### 🐳 Docker Hub Image

Pull the latest image from Docker Hub:

```bash
# Pull latest version
docker pull productdevbook/nitroping:latest

# Or specific version
docker pull productdevbook/nitroping:v0.0.1
```

**Using with docker-compose.yaml:**
```yaml
services:
  server:
    image: productdevbook/nitroping:latest
    environment:
      DATABASE_URL: postgres://user:password@db:5432/nitroping
    ports:
      - "3000:3000"
```


### Creating Your First App

1. **Create an app via API**
   ```bash
   curl -X POST http://localhost:3000/api/v1/apps/create \
     -H "Content-Type: application/json" \
     -d '{
       "name": "My App",
       "slug": "my-app",
       "description": "My awesome app"
     }'
   ```

2. **Configure push providers** (add FCM/APNs/WebPush credentials through the admin dashboard)

3. **Register devices and start sending notifications!**

## 🗒️ Roadmap

### ✅ Completed
- [x] Core service architecture
- [x] APNs integration
- [x] FCM integration  
- [x] Web Push support
- [x] GraphQL API
- [x] Dashboard UI
- [x] Docker deployment & Docker Hub publishing
- [x] Documentation site (this website!)

### 🚧 In Progress
- [ ] [Swift iOS SDK](https://github.com/productdevbook/nitroping/issues/14) - Native iOS development (work in progress in `ios/package`)
- [ ] [Queue system](https://github.com/productdevbook/nitroping/issues/13) (technology choice under community discussion)

### 📋 Planned Features
- [ ] [Android SDK](https://github.com/productdevbook/nitroping/issues/15) - Native Android development with Kotlin
- [ ] [Sign-in System](https://github.com/productdevbook/nitroping/issues/9) - User authentication and account management
- [ ] [React Native SDK](https://github.com/productdevbook/nitroping/issues/10) - Cross-platform mobile development support
- [ ] [Flutter SDK](https://github.com/productdevbook/nitroping/issues/11) - Google's cross-platform framework support
- [ ] [Unity SDK](https://github.com/productdevbook/nitroping/issues/12) - Game development integration

---

**Built with ❤️ by the open source community**

*Want to be part of building the future of self-hosted push notifications? Star this repo and let's build something amazing together!*