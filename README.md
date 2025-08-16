# NitroPing 🚀

> Self-hosted push notification service built with Nuxt 4 & Nitro

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

- [x] Core service architecture
- [x] APNs integration
- [x] FCM integration  
- [x] Web Push support
- [ ] GraphQL API
- [ ] Admin dashboard UI
- [ ] Queue system (BullMQ + Redis)
- [ ] Docker deployment
- [ ] Documentation site

---

**Built with ❤️ by the open source community**

*Want to be part of building the future of self-hosted push notifications? Star this repo and let's build something amazing together!*