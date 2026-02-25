// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable eslint-comments/no-unlimited-disable */
/* tslint:disable */
/* eslint-disable */
/* prettier-ignore */
import type * as Types from '#graphql/client';

import type { ExecutionResult } from 'graphql';

export const GetNotificationAnalyticsDocument = /*#__PURE__*/ `
    query getNotificationAnalytics($notificationId: ID!) {
  getNotificationAnalytics(notificationId: $notificationId) {
    notificationId
    sentCount
    deliveredCount
    openedCount
    clickedCount
    deliveryRate
    openRate
    clickRate
    platformBreakdown {
      platform
      sent
      delivered
      opened
      clicked
      avgDeliveryTime
      avgOpenTime
    }
  }
}
    `;
export const GetEngagementMetricsDocument = /*#__PURE__*/ `
    query getEngagementMetrics($appId: ID!, $timeRange: String) {
  getEngagementMetrics(appId: $appId, timeRange: $timeRange) {
    totalNotifications
    totalSent
    totalDelivered
    totalOpened
    totalClicked
    overallDeliveryRate
    overallOpenRate
    overallClickRate
    platformBreakdown {
      platform
      sent
      delivered
      opened
      clicked
      avgDeliveryTime
      avgOpenTime
    }
  }
}
    `;
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
export const ConfigureApNsDocument = /*#__PURE__*/ `
    mutation configureAPNs($id: ID!, $input: ConfigureAPNsInput!) {
  configureAPNs(id: $id, input: $input) {
    id
    apnsKeyId
    apnsTeamId
    updatedAt
  }
}
    `;
export const ConfigureFcmDocument = /*#__PURE__*/ `
    mutation configureFCM($id: ID!, $input: ConfigureFCMInput!) {
  configureFCM(id: $id, input: $input) {
    id
    fcmProjectId
    updatedAt
  }
}
    `;
export const ConfigureWebPushDocument = /*#__PURE__*/ `
    mutation configureWebPush($id: ID!, $input: ConfigureWebPushInput!) {
  configureWebPush(id: $id, input: $input) {
    id
    vapidSubject
    vapidPublicKey
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
    fcmProjectId
    fcmServiceAccount
    apnsKeyId
    apnsTeamId
    apnsPrivateKey
    bundleId
    vapidSubject
    vapidPublicKey
    vapidPrivateKey
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
    fcmServiceAccount
    apnsKeyId
    apnsTeamId
    apnsPrivateKey
    bundleId
    vapidSubject
    vapidPublicKey
    vapidPrivateKey
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
export const GenerateVapidKeysDocument = /*#__PURE__*/ `
    query generateVapidKeys {
  generateVapidKeys {
    publicKey
    privateKey
  }
}
    `;
export const CreateChannelDocument = /*#__PURE__*/ `
    mutation createChannel($input: CreateChannelInput!) {
  createChannel(input: $input) {
    id
    appId
    name
    type
    isActive
    createdAt
    updatedAt
  }
}
    `;
export const UpdateChannelDocument = /*#__PURE__*/ `
    mutation updateChannel($id: ID!, $input: UpdateChannelInput!) {
  updateChannel(id: $id, input: $input) {
    id
    name
    type
    isActive
    updatedAt
  }
}
    `;
export const DeleteChannelDocument = /*#__PURE__*/ `
    mutation deleteChannel($id: ID!) {
  deleteChannel(id: $id)
}
    `;
export const ChannelsDocument = /*#__PURE__*/ `
    query channels($appId: ID!, $type: ChannelType) {
  channels(appId: $appId, type: $type) {
    id
    appId
    name
    type
    isActive
    createdAt
    updatedAt
  }
}
    `;
export const ChannelDocument = /*#__PURE__*/ `
    query channel($id: ID!) {
  channel(id: $id) {
    id
    appId
    name
    type
    isActive
    createdAt
    updatedAt
  }
}
    `;
export const CreateContactDocument = /*#__PURE__*/ `
    mutation createContact($input: CreateContactInput!) {
  createContact(input: $input) {
    id
    appId
    externalId
    name
    email
    phone
    locale
    createdAt
    updatedAt
  }
}
    `;
export const UpdateContactDocument = /*#__PURE__*/ `
    mutation updateContact($id: ID!, $input: UpdateContactInput!) {
  updateContact(id: $id, input: $input) {
    id
    externalId
    name
    email
    phone
    locale
    updatedAt
  }
}
    `;
export const DeleteContactDocument = /*#__PURE__*/ `
    mutation deleteContact($id: ID!) {
  deleteContact(id: $id)
}
    `;
export const UpsertContactDeviceDocument = /*#__PURE__*/ `
    mutation upsertContactDevice($input: UpsertContactDeviceInput!) {
  upsertContactDevice(input: $input)
}
    `;
export const UpdateContactPreferenceDocument = /*#__PURE__*/ `
    mutation updateContactPreference($input: UpdateContactPreferenceInput!) {
  updateContactPreference(input: $input) {
    id
    subscriberId
    category
    channelType
    enabled
    updatedAt
  }
}
    `;
export const ContactsDocument = /*#__PURE__*/ `
    query contacts($appId: ID!, $limit: Int, $offset: Int) {
  contacts(appId: $appId, limit: $limit, offset: $offset) {
    id
    appId
    externalId
    name
    email
    phone
    locale
    metadata
    createdAt
    updatedAt
  }
}
    `;
export const ContactDocument = /*#__PURE__*/ `
    query contact($id: ID!) {
  contact(id: $id) {
    id
    appId
    externalId
    name
    email
    phone
    locale
    metadata
    createdAt
    updatedAt
    preferences {
      id
      subscriberId
      category
      channelType
      enabled
      updatedAt
    }
  }
}
    `;
export const ContactByExternalIdDocument = /*#__PURE__*/ `
    query contactByExternalId($appId: ID!, $externalId: String!) {
  contactByExternalId(appId: $appId, externalId: $externalId) {
    id
    appId
    externalId
    name
    email
    phone
    locale
    metadata
    createdAt
    updatedAt
  }
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
    category
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
    category
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
    category
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
export const CreateHookDocument = /*#__PURE__*/ `
    mutation createHook($input: CreateHookInput!) {
  createHook(input: $input) {
    id
    appId
    name
    url
    events
    isActive
    createdAt
    updatedAt
  }
}
    `;
export const UpdateHookDocument = /*#__PURE__*/ `
    mutation updateHook($id: ID!, $input: UpdateHookInput!) {
  updateHook(id: $id, input: $input) {
    id
    name
    url
    events
    isActive
    updatedAt
  }
}
    `;
export const DeleteHookDocument = /*#__PURE__*/ `
    mutation deleteHook($id: ID!) {
  deleteHook(id: $id)
}
    `;
export const HooksDocument = /*#__PURE__*/ `
    query hooks($appId: ID!) {
  hooks(appId: $appId) {
    id
    appId
    name
    url
    events
    isActive
    createdAt
    updatedAt
  }
}
    `;
export const HookDocument = /*#__PURE__*/ `
    query hook($id: ID!) {
  hook(id: $id) {
    id
    appId
    name
    url
    events
    isActive
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
export const NotificationsDocument = /*#__PURE__*/ `
    query notifications($appId: ID) {
  notifications(appId: $appId) {
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
export const NotificationDocument = /*#__PURE__*/ `
    query notification($id: ID!) {
  notification(id: $id) {
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
    totalOpened
    totalClicked
    createdAt
    updatedAt
    sentAt
    deliveryLogs {
      id
      deviceId
      to
      status
      errorMessage
      sentAt
      openedAt
      clickedAt
      createdAt
    }
  }
}
    `;
export const DeliveryLogsDocument = /*#__PURE__*/ `
    query deliveryLogs($notificationId: ID) {
  deliveryLogs(notificationId: $notificationId) {
    id
    notificationId
    deviceId
    to
    status
    errorMessage
    sentAt
    openedAt
    clickedAt
    createdAt
    updatedAt
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
export const CreateTemplateDocument = /*#__PURE__*/ `
    mutation createTemplate($input: CreateTemplateInput!) {
  createTemplate(input: $input) {
    id
    appId
    channelId
    name
    channelType
    subject
    body
    htmlBody
    createdAt
    updatedAt
  }
}
    `;
export const UpdateTemplateDocument = /*#__PURE__*/ `
    mutation updateTemplate($id: ID!, $input: UpdateTemplateInput!) {
  updateTemplate(id: $id, input: $input) {
    id
    name
    subject
    body
    htmlBody
    updatedAt
  }
}
    `;
export const DeleteTemplateDocument = /*#__PURE__*/ `
    mutation deleteTemplate($id: ID!) {
  deleteTemplate(id: $id)
}
    `;
export const TemplatesDocument = /*#__PURE__*/ `
    query templates($appId: ID!, $channelType: ChannelType) {
  templates(appId: $appId, channelType: $channelType) {
    id
    appId
    channelId
    name
    channelType
    subject
    body
    htmlBody
    createdAt
    updatedAt
  }
}
    `;
export const TemplateDocument = /*#__PURE__*/ `
    query template($id: ID!) {
  template(id: $id) {
    id
    appId
    channelId
    name
    channelType
    subject
    body
    htmlBody
    createdAt
    updatedAt
  }
}
    `;
export const CreateWorkflowDocument = /*#__PURE__*/ `
    mutation createWorkflow($input: CreateWorkflowInput!) {
  createWorkflow(input: $input) {
    id
    appId
    name
    triggerIdentifier
    triggerType
    status
    flowLayout
    createdAt
    updatedAt
  }
}
    `;
export const UpdateWorkflowDocument = /*#__PURE__*/ `
    mutation updateWorkflow($id: ID!, $input: UpdateWorkflowInput!) {
  updateWorkflow(id: $id, input: $input) {
    id
    name
    triggerIdentifier
    triggerType
    status
    flowLayout
    updatedAt
    steps {
      id
      nodeId
      type
      order
      config
    }
  }
}
    `;
export const DeleteWorkflowDocument = /*#__PURE__*/ `
    mutation deleteWorkflow($id: ID!) {
  deleteWorkflow(id: $id)
}
    `;
export const TriggerWorkflowDocument = /*#__PURE__*/ `
    mutation triggerWorkflow($input: TriggerWorkflowInput!) {
  triggerWorkflow(input: $input) {
    id
    workflowId
    status
    triggerIdentifier
    startedAt
    createdAt
  }
}
    `;
export const WorkflowsDocument = /*#__PURE__*/ `
    query workflows($appId: ID!, $status: WorkflowStatus) {
  workflows(appId: $appId, status: $status) {
    id
    appId
    name
    triggerIdentifier
    triggerType
    status
    flowLayout
    createdAt
    updatedAt
    steps {
      id
      nodeId
      type
      order
      config
    }
  }
}
    `;
export const WorkflowDocument = /*#__PURE__*/ `
    query workflow($id: ID!) {
  workflow(id: $id) {
    id
    appId
    name
    triggerIdentifier
    triggerType
    status
    flowLayout
    createdAt
    updatedAt
    steps {
      id
      nodeId
      type
      order
      config
    }
  }
}
    `;
export const WorkflowExecutionsDocument = /*#__PURE__*/ `
    query workflowExecutions($workflowId: ID!, $limit: Int, $offset: Int) {
  workflowExecutions(workflowId: $workflowId, limit: $limit, offset: $offset) {
    id
    workflowId
    subscriberId
    triggerIdentifier
    payload
    status
    currentStepOrder
    errorMessage
    startedAt
    completedAt
    createdAt
    updatedAt
  }
}
    `;
export type Requester<C = {}, E = unknown> = <R, V>(doc: string, vars?: V, options?: C) => Promise<ExecutionResult<R, E>> | AsyncIterable<ExecutionResult<R, E>>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    getNotificationAnalytics(variables: Types.GetNotificationAnalyticsQueryVariables, options?: C): Promise<ExecutionResult<Types.GetNotificationAnalyticsQuery, E>> {
      return requester<Types.GetNotificationAnalyticsQuery, Types.GetNotificationAnalyticsQueryVariables>(GetNotificationAnalyticsDocument, variables, options) as Promise<ExecutionResult<Types.GetNotificationAnalyticsQuery, E>>;
    },
    getEngagementMetrics(variables: Types.GetEngagementMetricsQueryVariables, options?: C): Promise<ExecutionResult<Types.GetEngagementMetricsQuery, E>> {
      return requester<Types.GetEngagementMetricsQuery, Types.GetEngagementMetricsQueryVariables>(GetEngagementMetricsDocument, variables, options) as Promise<ExecutionResult<Types.GetEngagementMetricsQuery, E>>;
    },
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
    configureAPNs(variables: Types.ConfigureApNsMutationVariables, options?: C): Promise<ExecutionResult<Types.ConfigureApNsMutation, E>> {
      return requester<Types.ConfigureApNsMutation, Types.ConfigureApNsMutationVariables>(ConfigureApNsDocument, variables, options) as Promise<ExecutionResult<Types.ConfigureApNsMutation, E>>;
    },
    configureFCM(variables: Types.ConfigureFcmMutationVariables, options?: C): Promise<ExecutionResult<Types.ConfigureFcmMutation, E>> {
      return requester<Types.ConfigureFcmMutation, Types.ConfigureFcmMutationVariables>(ConfigureFcmDocument, variables, options) as Promise<ExecutionResult<Types.ConfigureFcmMutation, E>>;
    },
    configureWebPush(variables: Types.ConfigureWebPushMutationVariables, options?: C): Promise<ExecutionResult<Types.ConfigureWebPushMutation, E>> {
      return requester<Types.ConfigureWebPushMutation, Types.ConfigureWebPushMutationVariables>(ConfigureWebPushDocument, variables, options) as Promise<ExecutionResult<Types.ConfigureWebPushMutation, E>>;
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
    generateVapidKeys(variables?: Types.GenerateVapidKeysQueryVariables, options?: C): Promise<ExecutionResult<Types.GenerateVapidKeysQuery, E>> {
      return requester<Types.GenerateVapidKeysQuery, Types.GenerateVapidKeysQueryVariables>(GenerateVapidKeysDocument, variables, options) as Promise<ExecutionResult<Types.GenerateVapidKeysQuery, E>>;
    },
    createChannel(variables: Types.CreateChannelMutationVariables, options?: C): Promise<ExecutionResult<Types.CreateChannelMutation, E>> {
      return requester<Types.CreateChannelMutation, Types.CreateChannelMutationVariables>(CreateChannelDocument, variables, options) as Promise<ExecutionResult<Types.CreateChannelMutation, E>>;
    },
    updateChannel(variables: Types.UpdateChannelMutationVariables, options?: C): Promise<ExecutionResult<Types.UpdateChannelMutation, E>> {
      return requester<Types.UpdateChannelMutation, Types.UpdateChannelMutationVariables>(UpdateChannelDocument, variables, options) as Promise<ExecutionResult<Types.UpdateChannelMutation, E>>;
    },
    deleteChannel(variables: Types.DeleteChannelMutationVariables, options?: C): Promise<ExecutionResult<Types.DeleteChannelMutation, E>> {
      return requester<Types.DeleteChannelMutation, Types.DeleteChannelMutationVariables>(DeleteChannelDocument, variables, options) as Promise<ExecutionResult<Types.DeleteChannelMutation, E>>;
    },
    channels(variables: Types.ChannelsQueryVariables, options?: C): Promise<ExecutionResult<Types.ChannelsQuery, E>> {
      return requester<Types.ChannelsQuery, Types.ChannelsQueryVariables>(ChannelsDocument, variables, options) as Promise<ExecutionResult<Types.ChannelsQuery, E>>;
    },
    channel(variables: Types.ChannelQueryVariables, options?: C): Promise<ExecutionResult<Types.ChannelQuery, E>> {
      return requester<Types.ChannelQuery, Types.ChannelQueryVariables>(ChannelDocument, variables, options) as Promise<ExecutionResult<Types.ChannelQuery, E>>;
    },
    createContact(variables: Types.CreateContactMutationVariables, options?: C): Promise<ExecutionResult<Types.CreateContactMutation, E>> {
      return requester<Types.CreateContactMutation, Types.CreateContactMutationVariables>(CreateContactDocument, variables, options) as Promise<ExecutionResult<Types.CreateContactMutation, E>>;
    },
    updateContact(variables: Types.UpdateContactMutationVariables, options?: C): Promise<ExecutionResult<Types.UpdateContactMutation, E>> {
      return requester<Types.UpdateContactMutation, Types.UpdateContactMutationVariables>(UpdateContactDocument, variables, options) as Promise<ExecutionResult<Types.UpdateContactMutation, E>>;
    },
    deleteContact(variables: Types.DeleteContactMutationVariables, options?: C): Promise<ExecutionResult<Types.DeleteContactMutation, E>> {
      return requester<Types.DeleteContactMutation, Types.DeleteContactMutationVariables>(DeleteContactDocument, variables, options) as Promise<ExecutionResult<Types.DeleteContactMutation, E>>;
    },
    upsertContactDevice(variables: Types.UpsertContactDeviceMutationVariables, options?: C): Promise<ExecutionResult<Types.UpsertContactDeviceMutation, E>> {
      return requester<Types.UpsertContactDeviceMutation, Types.UpsertContactDeviceMutationVariables>(UpsertContactDeviceDocument, variables, options) as Promise<ExecutionResult<Types.UpsertContactDeviceMutation, E>>;
    },
    updateContactPreference(variables: Types.UpdateContactPreferenceMutationVariables, options?: C): Promise<ExecutionResult<Types.UpdateContactPreferenceMutation, E>> {
      return requester<Types.UpdateContactPreferenceMutation, Types.UpdateContactPreferenceMutationVariables>(UpdateContactPreferenceDocument, variables, options) as Promise<ExecutionResult<Types.UpdateContactPreferenceMutation, E>>;
    },
    contacts(variables: Types.ContactsQueryVariables, options?: C): Promise<ExecutionResult<Types.ContactsQuery, E>> {
      return requester<Types.ContactsQuery, Types.ContactsQueryVariables>(ContactsDocument, variables, options) as Promise<ExecutionResult<Types.ContactsQuery, E>>;
    },
    contact(variables: Types.ContactQueryVariables, options?: C): Promise<ExecutionResult<Types.ContactQuery, E>> {
      return requester<Types.ContactQuery, Types.ContactQueryVariables>(ContactDocument, variables, options) as Promise<ExecutionResult<Types.ContactQuery, E>>;
    },
    contactByExternalId(variables: Types.ContactByExternalIdQueryVariables, options?: C): Promise<ExecutionResult<Types.ContactByExternalIdQuery, E>> {
      return requester<Types.ContactByExternalIdQuery, Types.ContactByExternalIdQueryVariables>(ContactByExternalIdDocument, variables, options) as Promise<ExecutionResult<Types.ContactByExternalIdQuery, E>>;
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
    createHook(variables: Types.CreateHookMutationVariables, options?: C): Promise<ExecutionResult<Types.CreateHookMutation, E>> {
      return requester<Types.CreateHookMutation, Types.CreateHookMutationVariables>(CreateHookDocument, variables, options) as Promise<ExecutionResult<Types.CreateHookMutation, E>>;
    },
    updateHook(variables: Types.UpdateHookMutationVariables, options?: C): Promise<ExecutionResult<Types.UpdateHookMutation, E>> {
      return requester<Types.UpdateHookMutation, Types.UpdateHookMutationVariables>(UpdateHookDocument, variables, options) as Promise<ExecutionResult<Types.UpdateHookMutation, E>>;
    },
    deleteHook(variables: Types.DeleteHookMutationVariables, options?: C): Promise<ExecutionResult<Types.DeleteHookMutation, E>> {
      return requester<Types.DeleteHookMutation, Types.DeleteHookMutationVariables>(DeleteHookDocument, variables, options) as Promise<ExecutionResult<Types.DeleteHookMutation, E>>;
    },
    hooks(variables: Types.HooksQueryVariables, options?: C): Promise<ExecutionResult<Types.HooksQuery, E>> {
      return requester<Types.HooksQuery, Types.HooksQueryVariables>(HooksDocument, variables, options) as Promise<ExecutionResult<Types.HooksQuery, E>>;
    },
    hook(variables: Types.HookQueryVariables, options?: C): Promise<ExecutionResult<Types.HookQuery, E>> {
      return requester<Types.HookQuery, Types.HookQueryVariables>(HookDocument, variables, options) as Promise<ExecutionResult<Types.HookQuery, E>>;
    },
    sendNotification(variables: Types.SendNotificationMutationVariables, options?: C): Promise<ExecutionResult<Types.SendNotificationMutation, E>> {
      return requester<Types.SendNotificationMutation, Types.SendNotificationMutationVariables>(SendNotificationDocument, variables, options) as Promise<ExecutionResult<Types.SendNotificationMutation, E>>;
    },
    notifications(variables?: Types.NotificationsQueryVariables, options?: C): Promise<ExecutionResult<Types.NotificationsQuery, E>> {
      return requester<Types.NotificationsQuery, Types.NotificationsQueryVariables>(NotificationsDocument, variables, options) as Promise<ExecutionResult<Types.NotificationsQuery, E>>;
    },
    notification(variables: Types.NotificationQueryVariables, options?: C): Promise<ExecutionResult<Types.NotificationQuery, E>> {
      return requester<Types.NotificationQuery, Types.NotificationQueryVariables>(NotificationDocument, variables, options) as Promise<ExecutionResult<Types.NotificationQuery, E>>;
    },
    deliveryLogs(variables?: Types.DeliveryLogsQueryVariables, options?: C): Promise<ExecutionResult<Types.DeliveryLogsQuery, E>> {
      return requester<Types.DeliveryLogsQuery, Types.DeliveryLogsQueryVariables>(DeliveryLogsDocument, variables, options) as Promise<ExecutionResult<Types.DeliveryLogsQuery, E>>;
    },
    dashboardStats(variables?: Types.DashboardStatsQueryVariables, options?: C): Promise<ExecutionResult<Types.DashboardStatsQuery, E>> {
      return requester<Types.DashboardStatsQuery, Types.DashboardStatsQueryVariables>(DashboardStatsDocument, variables, options) as Promise<ExecutionResult<Types.DashboardStatsQuery, E>>;
    },
    createTemplate(variables: Types.CreateTemplateMutationVariables, options?: C): Promise<ExecutionResult<Types.CreateTemplateMutation, E>> {
      return requester<Types.CreateTemplateMutation, Types.CreateTemplateMutationVariables>(CreateTemplateDocument, variables, options) as Promise<ExecutionResult<Types.CreateTemplateMutation, E>>;
    },
    updateTemplate(variables: Types.UpdateTemplateMutationVariables, options?: C): Promise<ExecutionResult<Types.UpdateTemplateMutation, E>> {
      return requester<Types.UpdateTemplateMutation, Types.UpdateTemplateMutationVariables>(UpdateTemplateDocument, variables, options) as Promise<ExecutionResult<Types.UpdateTemplateMutation, E>>;
    },
    deleteTemplate(variables: Types.DeleteTemplateMutationVariables, options?: C): Promise<ExecutionResult<Types.DeleteTemplateMutation, E>> {
      return requester<Types.DeleteTemplateMutation, Types.DeleteTemplateMutationVariables>(DeleteTemplateDocument, variables, options) as Promise<ExecutionResult<Types.DeleteTemplateMutation, E>>;
    },
    templates(variables: Types.TemplatesQueryVariables, options?: C): Promise<ExecutionResult<Types.TemplatesQuery, E>> {
      return requester<Types.TemplatesQuery, Types.TemplatesQueryVariables>(TemplatesDocument, variables, options) as Promise<ExecutionResult<Types.TemplatesQuery, E>>;
    },
    template(variables: Types.TemplateQueryVariables, options?: C): Promise<ExecutionResult<Types.TemplateQuery, E>> {
      return requester<Types.TemplateQuery, Types.TemplateQueryVariables>(TemplateDocument, variables, options) as Promise<ExecutionResult<Types.TemplateQuery, E>>;
    },
    createWorkflow(variables: Types.CreateWorkflowMutationVariables, options?: C): Promise<ExecutionResult<Types.CreateWorkflowMutation, E>> {
      return requester<Types.CreateWorkflowMutation, Types.CreateWorkflowMutationVariables>(CreateWorkflowDocument, variables, options) as Promise<ExecutionResult<Types.CreateWorkflowMutation, E>>;
    },
    updateWorkflow(variables: Types.UpdateWorkflowMutationVariables, options?: C): Promise<ExecutionResult<Types.UpdateWorkflowMutation, E>> {
      return requester<Types.UpdateWorkflowMutation, Types.UpdateWorkflowMutationVariables>(UpdateWorkflowDocument, variables, options) as Promise<ExecutionResult<Types.UpdateWorkflowMutation, E>>;
    },
    deleteWorkflow(variables: Types.DeleteWorkflowMutationVariables, options?: C): Promise<ExecutionResult<Types.DeleteWorkflowMutation, E>> {
      return requester<Types.DeleteWorkflowMutation, Types.DeleteWorkflowMutationVariables>(DeleteWorkflowDocument, variables, options) as Promise<ExecutionResult<Types.DeleteWorkflowMutation, E>>;
    },
    triggerWorkflow(variables: Types.TriggerWorkflowMutationVariables, options?: C): Promise<ExecutionResult<Types.TriggerWorkflowMutation, E>> {
      return requester<Types.TriggerWorkflowMutation, Types.TriggerWorkflowMutationVariables>(TriggerWorkflowDocument, variables, options) as Promise<ExecutionResult<Types.TriggerWorkflowMutation, E>>;
    },
    workflows(variables: Types.WorkflowsQueryVariables, options?: C): Promise<ExecutionResult<Types.WorkflowsQuery, E>> {
      return requester<Types.WorkflowsQuery, Types.WorkflowsQueryVariables>(WorkflowsDocument, variables, options) as Promise<ExecutionResult<Types.WorkflowsQuery, E>>;
    },
    workflow(variables: Types.WorkflowQueryVariables, options?: C): Promise<ExecutionResult<Types.WorkflowQuery, E>> {
      return requester<Types.WorkflowQuery, Types.WorkflowQueryVariables>(WorkflowDocument, variables, options) as Promise<ExecutionResult<Types.WorkflowQuery, E>>;
    },
    workflowExecutions(variables: Types.WorkflowExecutionsQueryVariables, options?: C): Promise<ExecutionResult<Types.WorkflowExecutionsQuery, E>> {
      return requester<Types.WorkflowExecutionsQuery, Types.WorkflowExecutionsQueryVariables>(WorkflowExecutionsDocument, variables, options) as Promise<ExecutionResult<Types.WorkflowExecutionsQuery, E>>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;