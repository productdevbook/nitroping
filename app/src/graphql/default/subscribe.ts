// This file is auto-generated once by nitro-graphql for quick start
// You can modify this file to customize the subscription client
// The implementation comes from nitro-graphql/subscribe - you'll get updates automatically!
//
// Usage Examples:
// ---------------
// Basic subscription:
//   subscriptionClient.subscribe(query, variables, onData, onError)
//
// Multiplexed subscriptions (shared connection):
//   const session = subscriptionClient.createSession()
//   session.subscribe(query1, vars1, onData1)
//   session.subscribe(query2, vars2, onData2)
//
// With authentication:
//   Edit connectionParams below to add auth headers

import type {
  ConnectionState,
  SubscriptionClient,
  SubscriptionClientConfig,
  SubscriptionHandle,
  SubscriptionSession,
} from 'nitro-graphql/subscribe'
import { createSubscriptionClient } from 'nitro-graphql/subscribe'

// Re-export types for convenience
export type { ConnectionState, SubscriptionClient, SubscriptionHandle, SubscriptionSession }

// Configure the subscription client
// Customize these settings according to your needs
const config: SubscriptionClientConfig = {
  // WebSocket endpoint (default: '/api/graphql/ws')
  wsEndpoint: '/api/graphql/ws',

  // Connection timeout in ms (default: 10000)
  connectionTimeoutMs: 10000,

  // Max reconnection attempts (default: 5)
  maxRetries: 5,

  // Authentication params sent with connection_init
  // Can be a function for dynamic values (e.g., JWT tokens)
  // connectionParams: () => ({
  //   authorization: `Bearer ${getToken()}`,
  // }),
}

// Export configured client instance
export const subscriptionClient = createSubscriptionClient(config)
