# Getting Started

Welcome to **NitroPing** — a self-hosted, multi-channel notification infrastructure. Send emails, SMS, push notifications, Discord messages, and Telegram messages through a unified workflow engine.

## Prerequisites

Before you begin, make sure you have:

1. A running NitroPing instance
2. An **Application** created in the dashboard
3. An **API key** from your app settings (`Apps → Settings → API Key`)
4. At least one **Channel** configured (Email, SMS, Discord, or Telegram)

## Base URL

All REST API requests are made to:

```
https://your-nitroping-instance.com/api/v1
```

The GraphQL endpoint is available at:

```
https://your-nitroping-instance.com/api/graphql
```

## Quick Start

### 1. Create an application

Go to the **Apps** section and create a new application. Each app has its own API key, channels, contacts, and workflows.

### 2. Add a channel

Navigate to **Apps → Channels** and configure at least one delivery channel. See the [Channels guide](/docs#channels) for supported providers.

### 3. Create a template

Go to **Apps → Templates** and write your message template. You can use `{{ variable }}` syntax for dynamic content.

### 4. Build a workflow

Open **Apps → Workflows**, create a new workflow, and connect a **Trigger → Send** node. Save and set the workflow to **Active**.

### 5. Trigger the workflow

Call the `triggerWorkflow` GraphQL mutation with a `subscriberId` and optional `payload`.
