// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable eslint-comments/no-unlimited-disable */
/* tslint:disable */
/* eslint-disable */
/* prettier-ignore */
import type * as Types from '#graphql/client';

import type { ExecutionResult } from 'graphql';

export const CreateAppDocument = /*#__PURE__*/ `
    mutation createApp($input: CreateAppInput!) {
  createApp(input: $input) {
    id
    name
    slug
    description
    isActive
    apiKey
    createdAt
    updatedAt
  }
}
    `;
export const UpdateAppDocument = /*#__PURE__*/ `
    mutation updateApp($id: ID!, $input: UpdateAppInput!) {
  updateApp(id: $id, input: $input) {
    id
    name
    slug
    description
    isActive
    fcmProjectId
    apnsKeyId
    apnsTeamId
    vapidSubject
    vapidPublicKey
    updatedAt
  }
}
    `;
export const DeleteAppDocument = /*#__PURE__*/ `
    mutation deleteApp($id: ID!) {
  deleteApp(id: $id)
}
    `;
export const RegenerateApiKeyDocument = /*#__PURE__*/ `
    mutation regenerateApiKey($id: ID!) {
  regenerateApiKey(id: $id) {
    id
    apiKey
    updatedAt
  }
}
    `;
export const AppsDocument = /*#__PURE__*/ `
    query apps {
  apps {
    id
    name
    slug
    description
    isActive
    apiKey
    createdAt
    updatedAt
    stats {
      totalDevices
      activeDevices
      newDevicesToday
      sentToday
      deliveryRate
      apiCalls
    }
  }
}
    `;
export const AppDocument = /*#__PURE__*/ `
    query app($id: ID!) {
  app(id: $id) {
    id
    name
    slug
    description
    isActive
    apiKey
    fcmProjectId
    apnsKeyId
    apnsTeamId
    vapidSubject
    vapidPublicKey
    createdAt
    updatedAt
    stats {
      totalDevices
      activeDevices
      newDevicesToday
      sentToday
      deliveryRate
      apiCalls
    }
  }
}
    `;
export const AppBySlugDocument = /*#__PURE__*/ `
    query appBySlug($slug: String!) {
  appBySlug(slug: $slug) {
    id
    name
    slug
    description
    isActive
    apiKey
    createdAt
    updatedAt
  }
}
    `;
export const AppExistsDocument = /*#__PURE__*/ `
    query appExists($slug: String!) {
  appExists(slug: $slug)
}
    `;
export const RegisterDeviceDocument = /*#__PURE__*/ `
    mutation registerDevice($input: RegisterDeviceInput!) {
  registerDevice(input: $input) {
    id
    appId
    token
    platform
    userId
    status
    metadata
    lastSeenAt
    createdAt
    updatedAt
  }
}
    `;
export const UpdateDeviceDocument = /*#__PURE__*/ `
    mutation updateDevice($id: ID!, $input: UpdateDeviceInput!) {
  updateDevice(id: $id, input: $input) {
    id
    appId
    token
    platform
    userId
    status
    metadata
    lastSeenAt
    updatedAt
  }
}
    `;
export const DeleteDeviceDocument = /*#__PURE__*/ `
    mutation deleteDevice($id: ID!) {
  deleteDevice(id: $id)
}
    `;
export const DevicesDocument = /*#__PURE__*/ `
    query devices($appId: ID) {
  devices(appId: $appId) {
    id
    appId
    token
    platform
    userId
    status
    metadata
    lastSeenAt
    createdAt
    updatedAt
  }
}
    `;
export const DeviceDocument = /*#__PURE__*/ `
    query device($id: ID!) {
  device(id: $id) {
    id
    appId
    token
    platform
    userId
    status
    metadata
    lastSeenAt
    createdAt
    updatedAt
  }
}
    `;
export const DeviceByTokenDocument = /*#__PURE__*/ `
    query deviceByToken($token: String!) {
  deviceByToken(token: $token) {
    id
    appId
    token
    platform
    userId
    status
    metadata
    lastSeenAt
    createdAt
    updatedAt
  }
}
    `;
export const SendNotificationDocument = /*#__PURE__*/ `
    mutation sendNotification($input: SendNotificationInput!) {
  sendNotification(input: $input) {
    id
    appId
    title
    body
    data
    badge
    sound
    clickAction
    imageUrl
    targetDevices
    platforms
    scheduledAt
    status
    totalTargets
    totalSent
    totalDelivered
    totalFailed
    totalClicked
    createdAt
    updatedAt
    sentAt
  }
}
    `;
export const DashboardStatsDocument = /*#__PURE__*/ `
    query dashboardStats {
  dashboardStats {
    totalApps
    activeDevices
    notificationsSent
    deliveryRate
  }
}
    `;
export type Requester<C = {}, E = unknown> = <R, V>(doc: string, vars?: V, options?: C) => Promise<ExecutionResult<R, E>> | AsyncIterable<ExecutionResult<R, E>>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    createApp(variables: Types.CreateAppMutationVariables, options?: C): Promise<ExecutionResult<Types.CreateAppMutation, E>> {
      return requester<Types.CreateAppMutation, Types.CreateAppMutationVariables>(CreateAppDocument, variables, options) as Promise<ExecutionResult<Types.CreateAppMutation, E>>;
    },
    updateApp(variables: Types.UpdateAppMutationVariables, options?: C): Promise<ExecutionResult<Types.UpdateAppMutation, E>> {
      return requester<Types.UpdateAppMutation, Types.UpdateAppMutationVariables>(UpdateAppDocument, variables, options) as Promise<ExecutionResult<Types.UpdateAppMutation, E>>;
    },
    deleteApp(variables: Types.DeleteAppMutationVariables, options?: C): Promise<ExecutionResult<Types.DeleteAppMutation, E>> {
      return requester<Types.DeleteAppMutation, Types.DeleteAppMutationVariables>(DeleteAppDocument, variables, options) as Promise<ExecutionResult<Types.DeleteAppMutation, E>>;
    },
    regenerateApiKey(variables: Types.RegenerateApiKeyMutationVariables, options?: C): Promise<ExecutionResult<Types.RegenerateApiKeyMutation, E>> {
      return requester<Types.RegenerateApiKeyMutation, Types.RegenerateApiKeyMutationVariables>(RegenerateApiKeyDocument, variables, options) as Promise<ExecutionResult<Types.RegenerateApiKeyMutation, E>>;
    },
    apps(variables?: Types.AppsQueryVariables, options?: C): Promise<ExecutionResult<Types.AppsQuery, E>> {
      return requester<Types.AppsQuery, Types.AppsQueryVariables>(AppsDocument, variables, options) as Promise<ExecutionResult<Types.AppsQuery, E>>;
    },
    app(variables: Types.AppQueryVariables, options?: C): Promise<ExecutionResult<Types.AppQuery, E>> {
      return requester<Types.AppQuery, Types.AppQueryVariables>(AppDocument, variables, options) as Promise<ExecutionResult<Types.AppQuery, E>>;
    },
    appBySlug(variables: Types.AppBySlugQueryVariables, options?: C): Promise<ExecutionResult<Types.AppBySlugQuery, E>> {
      return requester<Types.AppBySlugQuery, Types.AppBySlugQueryVariables>(AppBySlugDocument, variables, options) as Promise<ExecutionResult<Types.AppBySlugQuery, E>>;
    },
    appExists(variables: Types.AppExistsQueryVariables, options?: C): Promise<ExecutionResult<Types.AppExistsQuery, E>> {
      return requester<Types.AppExistsQuery, Types.AppExistsQueryVariables>(AppExistsDocument, variables, options) as Promise<ExecutionResult<Types.AppExistsQuery, E>>;
    },
    registerDevice(variables: Types.RegisterDeviceMutationVariables, options?: C): Promise<ExecutionResult<Types.RegisterDeviceMutation, E>> {
      return requester<Types.RegisterDeviceMutation, Types.RegisterDeviceMutationVariables>(RegisterDeviceDocument, variables, options) as Promise<ExecutionResult<Types.RegisterDeviceMutation, E>>;
    },
    updateDevice(variables: Types.UpdateDeviceMutationVariables, options?: C): Promise<ExecutionResult<Types.UpdateDeviceMutation, E>> {
      return requester<Types.UpdateDeviceMutation, Types.UpdateDeviceMutationVariables>(UpdateDeviceDocument, variables, options) as Promise<ExecutionResult<Types.UpdateDeviceMutation, E>>;
    },
    deleteDevice(variables: Types.DeleteDeviceMutationVariables, options?: C): Promise<ExecutionResult<Types.DeleteDeviceMutation, E>> {
      return requester<Types.DeleteDeviceMutation, Types.DeleteDeviceMutationVariables>(DeleteDeviceDocument, variables, options) as Promise<ExecutionResult<Types.DeleteDeviceMutation, E>>;
    },
    devices(variables?: Types.DevicesQueryVariables, options?: C): Promise<ExecutionResult<Types.DevicesQuery, E>> {
      return requester<Types.DevicesQuery, Types.DevicesQueryVariables>(DevicesDocument, variables, options) as Promise<ExecutionResult<Types.DevicesQuery, E>>;
    },
    device(variables: Types.DeviceQueryVariables, options?: C): Promise<ExecutionResult<Types.DeviceQuery, E>> {
      return requester<Types.DeviceQuery, Types.DeviceQueryVariables>(DeviceDocument, variables, options) as Promise<ExecutionResult<Types.DeviceQuery, E>>;
    },
    deviceByToken(variables: Types.DeviceByTokenQueryVariables, options?: C): Promise<ExecutionResult<Types.DeviceByTokenQuery, E>> {
      return requester<Types.DeviceByTokenQuery, Types.DeviceByTokenQueryVariables>(DeviceByTokenDocument, variables, options) as Promise<ExecutionResult<Types.DeviceByTokenQuery, E>>;
    },
    sendNotification(variables: Types.SendNotificationMutationVariables, options?: C): Promise<ExecutionResult<Types.SendNotificationMutation, E>> {
      return requester<Types.SendNotificationMutation, Types.SendNotificationMutationVariables>(SendNotificationDocument, variables, options) as Promise<ExecutionResult<Types.SendNotificationMutation, E>>;
    },
    dashboardStats(variables?: Types.DashboardStatsQueryVariables, options?: C): Promise<ExecutionResult<Types.DashboardStatsQuery, E>> {
      return requester<Types.DashboardStatsQuery, Types.DashboardStatsQueryVariables>(DashboardStatsDocument, variables, options) as Promise<ExecutionResult<Types.DashboardStatsQuery, E>>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;