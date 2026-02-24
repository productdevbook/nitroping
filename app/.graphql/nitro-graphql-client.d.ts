// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable eslint-comments/no-unlimited-disable */
/* tslint:disable */
/* eslint-disable */
/* prettier-ignore */
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
  Timestamp: { input: string; output: string; }
};

export type AnalyticsData = {
  __typename?: 'AnalyticsData';
  date: Scalars['String']['output'];
  sent: Scalars['Int']['output'];
  delivered: Scalars['Int']['output'];
  failed: Scalars['Int']['output'];
  clicked: Scalars['Int']['output'];
};

export type ApiKey = {
  __typename?: 'ApiKey';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  app?: Maybe<App>;
  name: Scalars['String']['output'];
  key: Scalars['String']['output'];
  permissions?: Maybe<Scalars['JSON']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  lastUsedAt?: Maybe<Scalars['Timestamp']['output']>;
  expiresAt?: Maybe<Scalars['Timestamp']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
};

export type App = {
  __typename?: 'App';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  apiKey: Scalars['String']['output'];
  fcmProjectId?: Maybe<Scalars['String']['output']>;
  fcmServiceAccount?: Maybe<Scalars['String']['output']>;
  apnsKeyId?: Maybe<Scalars['String']['output']>;
  apnsTeamId?: Maybe<Scalars['String']['output']>;
  apnsPrivateKey?: Maybe<Scalars['String']['output']>;
  bundleId?: Maybe<Scalars['String']['output']>;
  vapidSubject?: Maybe<Scalars['String']['output']>;
  vapidPublicKey?: Maybe<Scalars['String']['output']>;
  vapidPrivateKey?: Maybe<Scalars['String']['output']>;
  devices?: Maybe<Array<Device>>;
  notifications?: Maybe<Array<Notification>>;
  apiKeys?: Maybe<Array<ApiKey>>;
  stats?: Maybe<AppStats>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
};

export type AppStats = {
  __typename?: 'AppStats';
  totalDevices: Scalars['Int']['output'];
  activeDevices: Scalars['Int']['output'];
  newDevicesToday: Scalars['Int']['output'];
  sentToday: Scalars['Int']['output'];
  deliveryRate: Scalars['Float']['output'];
  apiCalls: Scalars['Int']['output'];
};

export type ConfigureApNsInput = {
  keyId: Scalars['String']['input'];
  teamId: Scalars['String']['input'];
  privateKey: Scalars['String']['input'];
  bundleId?: InputMaybe<Scalars['String']['input']>;
  isProduction?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ConfigureFcmInput = {
  projectId: Scalars['String']['input'];
  serviceAccount: Scalars['String']['input'];
};

export type ConfigureWebPushInput = {
  subject: Scalars['String']['input'];
  publicKey: Scalars['String']['input'];
  privateKey: Scalars['String']['input'];
};

export type CreateAppInput = {
  name: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
};

export type DashboardStats = {
  __typename?: 'DashboardStats';
  totalApps: Scalars['Int']['output'];
  activeDevices: Scalars['Int']['output'];
  notificationsSent: Scalars['Int']['output'];
  deliveryRate: Scalars['Float']['output'];
};

export type DeliveryLog = {
  __typename?: 'DeliveryLog';
  id: Scalars['ID']['output'];
  notificationId: Scalars['ID']['output'];
  notification?: Maybe<Notification>;
  deviceId: Scalars['ID']['output'];
  device?: Maybe<Device>;
  status: DeliveryStatus;
  errorMessage?: Maybe<Scalars['String']['output']>;
  clickedAt?: Maybe<Scalars['Timestamp']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
};

export type DeliveryStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CLICKED';

export type Device = {
  __typename?: 'Device';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  app?: Maybe<App>;
  token: Scalars['String']['output'];
  category?: Maybe<DeviceCategory>;
  platform: DevicePlatform;
  status: DeviceStatus;
  userId?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  webPushP256dh?: Maybe<Scalars['String']['output']>;
  webPushAuth?: Maybe<Scalars['String']['output']>;
  deliveryLogs?: Maybe<Array<DeliveryLog>>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  lastSeenAt?: Maybe<Scalars['Timestamp']['output']>;
};

export type DeviceCategory =
  | 'CHROME'
  | 'FIREFOX'
  | 'SAFARI'
  | 'EDGE'
  | 'OPERA';

export type DevicePlatform =
  | 'ANDROID'
  | 'IOS'
  | 'WEB';

export type DeviceStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'EXPIRED';

export type EngagementMetrics = {
  __typename?: 'EngagementMetrics';
  totalNotifications: Scalars['Int']['output'];
  totalSent: Scalars['Int']['output'];
  totalDelivered: Scalars['Int']['output'];
  totalOpened: Scalars['Int']['output'];
  totalClicked: Scalars['Int']['output'];
  overallDeliveryRate: Scalars['Float']['output'];
  overallOpenRate: Scalars['Float']['output'];
  overallClickRate: Scalars['Float']['output'];
  platformBreakdown: Array<PlatformMetrics>;
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  cancelNotification: Scalars['Boolean']['output'];
  configureAPNs: App;
  configureFCM: App;
  configureWebPush: App;
  createApp: App;
  deleteApp: Scalars['Boolean']['output'];
  deleteDevice: Scalars['Boolean']['output'];
  regenerateApiKey: App;
  registerDevice: Device;
  scheduleNotification: Notification;
  sendNotification: Notification;
  trackNotificationClicked: TrackEventResponse;
  trackNotificationDelivered: TrackEventResponse;
  trackNotificationOpened: TrackEventResponse;
  updateApp: App;
  updateDevice: Device;
};


export type MutationCancelNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationConfigureApNsArgs = {
  id: Scalars['ID']['input'];
  input: ConfigureApNsInput;
};


export type MutationConfigureFcmArgs = {
  id: Scalars['ID']['input'];
  input: ConfigureFcmInput;
};


export type MutationConfigureWebPushArgs = {
  id: Scalars['ID']['input'];
  input: ConfigureWebPushInput;
};


export type MutationCreateAppArgs = {
  input: CreateAppInput;
};


export type MutationDeleteAppArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDeviceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRegenerateApiKeyArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRegisterDeviceArgs = {
  input: RegisterDeviceInput;
};


export type MutationScheduleNotificationArgs = {
  input: SendNotificationInput;
};


export type MutationSendNotificationArgs = {
  input: SendNotificationInput;
};


export type MutationTrackNotificationClickedArgs = {
  input: TrackEventInput;
};


export type MutationTrackNotificationDeliveredArgs = {
  input: TrackEventInput;
};


export type MutationTrackNotificationOpenedArgs = {
  input: TrackEventInput;
};


export type MutationUpdateAppArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAppInput;
};


export type MutationUpdateDeviceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
};

export type Notification = {
  __typename?: 'Notification';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  app?: Maybe<App>;
  title: Scalars['String']['output'];
  body: Scalars['String']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  clickAction?: Maybe<Scalars['String']['output']>;
  sound?: Maybe<Scalars['String']['output']>;
  badge?: Maybe<Scalars['Int']['output']>;
  status: NotificationStatus;
  targetDevices?: Maybe<Scalars['JSON']['output']>;
  platforms?: Maybe<Scalars['JSON']['output']>;
  scheduledAt?: Maybe<Scalars['Timestamp']['output']>;
  totalTargets: Scalars['Int']['output'];
  totalSent: Scalars['Int']['output'];
  totalDelivered: Scalars['Int']['output'];
  totalFailed: Scalars['Int']['output'];
  totalClicked: Scalars['Int']['output'];
  deliveryLogs?: Maybe<Array<DeliveryLog>>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  sentAt?: Maybe<Scalars['Timestamp']['output']>;
};

export type NotificationAnalytics = {
  __typename?: 'NotificationAnalytics';
  notificationId: Scalars['ID']['output'];
  sentCount: Scalars['Int']['output'];
  deliveredCount: Scalars['Int']['output'];
  openedCount: Scalars['Int']['output'];
  clickedCount: Scalars['Int']['output'];
  deliveryRate: Scalars['Float']['output'];
  openRate: Scalars['Float']['output'];
  clickRate: Scalars['Float']['output'];
  platformBreakdown: Array<PlatformMetrics>;
};

export type NotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'SCHEDULED';

export type PageInfo = {
  __typename?: 'PageInfo';
  page: Scalars['Int']['output'];
  limit: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
  endCursor?: Maybe<Scalars['String']['output']>;
};

export type PlatformMetrics = {
  __typename?: 'PlatformMetrics';
  platform: Scalars['String']['output'];
  sent: Scalars['Int']['output'];
  delivered: Scalars['Int']['output'];
  opened: Scalars['Int']['output'];
  clicked: Scalars['Int']['output'];
  avgDeliveryTime?: Maybe<Scalars['Float']['output']>;
  avgOpenTime?: Maybe<Scalars['Float']['output']>;
};

export type PlatformStats = {
  __typename?: 'PlatformStats';
  platform: DevicePlatform;
  deviceCount: Scalars['Int']['output'];
  notificationsSent: Scalars['Int']['output'];
  deliveryRate: Scalars['Float']['output'];
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  analyticsData: Array<AnalyticsData>;
  app?: Maybe<App>;
  appBySlug?: Maybe<App>;
  appExists: Scalars['Boolean']['output'];
  appStats?: Maybe<AppStats>;
  apps: Array<App>;
  dashboardStats: DashboardStats;
  deliveryLogs: Array<DeliveryLog>;
  device?: Maybe<Device>;
  deviceByToken?: Maybe<Device>;
  devices: Array<Device>;
  generateVapidKeys: VapidKeys;
  getEngagementMetrics?: Maybe<EngagementMetrics>;
  getNotificationAnalytics?: Maybe<NotificationAnalytics>;
  notification?: Maybe<Notification>;
  notifications: Array<Notification>;
  platformStats: Array<PlatformStats>;
};


export type QueryAnalyticsDataArgs = {
  appId?: InputMaybe<Scalars['ID']['input']>;
  days?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAppArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAppBySlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryAppExistsArgs = {
  slug: Scalars['String']['input'];
};


export type QueryAppStatsArgs = {
  appId: Scalars['ID']['input'];
};


export type QueryDeliveryLogsArgs = {
  notificationId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDeviceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDeviceByTokenArgs = {
  token: Scalars['String']['input'];
};


export type QueryDevicesArgs = {
  appId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetEngagementMetricsArgs = {
  appId: Scalars['ID']['input'];
  timeRange?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetNotificationAnalyticsArgs = {
  notificationId: Scalars['ID']['input'];
};


export type QueryNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNotificationsArgs = {
  appId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPlatformStatsArgs = {
  appId?: InputMaybe<Scalars['ID']['input']>;
};

export type RegisterDeviceInput = {
  appId: Scalars['ID']['input'];
  token: Scalars['String']['input'];
  category?: InputMaybe<DeviceCategory>;
  platform: DevicePlatform;
  userId?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  webPushP256dh?: InputMaybe<Scalars['String']['input']>;
  webPushAuth?: InputMaybe<Scalars['String']['input']>;
};

export type SendNotificationInput = {
  appId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
  body: Scalars['String']['input'];
  data?: InputMaybe<Scalars['JSON']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  clickAction?: InputMaybe<Scalars['String']['input']>;
  sound?: InputMaybe<Scalars['String']['input']>;
  badge?: InputMaybe<Scalars['Int']['input']>;
  targetDevices?: InputMaybe<Scalars['JSON']['input']>;
  platforms?: InputMaybe<Scalars['JSON']['input']>;
  scheduledAt?: InputMaybe<Scalars['Timestamp']['input']>;
};

export type TrackEventInput = {
  notificationId: Scalars['ID']['input'];
  deviceId: Scalars['ID']['input'];
  platform?: InputMaybe<Scalars['String']['input']>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
  appVersion?: InputMaybe<Scalars['String']['input']>;
  osVersion?: InputMaybe<Scalars['String']['input']>;
};

export type TrackEventResponse = {
  __typename?: 'TrackEventResponse';
  success: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
};

export type UpdateAppInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  fcmProjectId?: InputMaybe<Scalars['String']['input']>;
  fcmServiceAccount?: InputMaybe<Scalars['String']['input']>;
  apnsKeyId?: InputMaybe<Scalars['String']['input']>;
  apnsTeamId?: InputMaybe<Scalars['String']['input']>;
  apnsPrivateKey?: InputMaybe<Scalars['String']['input']>;
  bundleId?: InputMaybe<Scalars['String']['input']>;
  vapidSubject?: InputMaybe<Scalars['String']['input']>;
  vapidPublicKey?: InputMaybe<Scalars['String']['input']>;
  vapidPrivateKey?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDeviceInput = {
  status?: InputMaybe<DeviceStatus>;
  userId?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
};

export type VapidKeys = {
  __typename?: 'VapidKeys';
  publicKey: Scalars['String']['output'];
  privateKey: Scalars['String']['output'];
};

export type GetNotificationAnalyticsQueryVariables = Exact<{
  notificationId: Scalars['ID']['input'];
}>;


export type GetNotificationAnalyticsQuery = { __typename?: 'Query', getNotificationAnalytics?: { __typename?: 'NotificationAnalytics', notificationId: string, sentCount: number, deliveredCount: number, openedCount: number, clickedCount: number, deliveryRate: number, openRate: number, clickRate: number, platformBreakdown: Array<{ __typename?: 'PlatformMetrics', platform: string, sent: number, delivered: number, opened: number, clicked: number, avgDeliveryTime?: number | null | undefined, avgOpenTime?: number | null | undefined }> } | null | undefined };

export type GetEngagementMetricsQueryVariables = Exact<{
  appId: Scalars['ID']['input'];
  timeRange?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetEngagementMetricsQuery = { __typename?: 'Query', getEngagementMetrics?: { __typename?: 'EngagementMetrics', totalNotifications: number, totalSent: number, totalDelivered: number, totalOpened: number, totalClicked: number, overallDeliveryRate: number, overallOpenRate: number, overallClickRate: number, platformBreakdown: Array<{ __typename?: 'PlatformMetrics', platform: string, sent: number, delivered: number, opened: number, clicked: number, avgDeliveryTime?: number | null | undefined, avgOpenTime?: number | null | undefined }> } | null | undefined };

export type CreateAppMutationVariables = Exact<{
  input: CreateAppInput;
}>;


export type CreateAppMutation = { __typename?: 'Mutation', createApp: { __typename?: 'App', id: string, name: string, slug: string, description?: string | null | undefined, isActive: boolean, apiKey: string, createdAt: string, updatedAt: string } };

export type UpdateAppMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAppInput;
}>;


export type UpdateAppMutation = { __typename?: 'Mutation', updateApp: { __typename?: 'App', id: string, name: string, slug: string, description?: string | null | undefined, isActive: boolean, fcmProjectId?: string | null | undefined, apnsKeyId?: string | null | undefined, apnsTeamId?: string | null | undefined, vapidSubject?: string | null | undefined, vapidPublicKey?: string | null | undefined, updatedAt: string } };

export type DeleteAppMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAppMutation = { __typename?: 'Mutation', deleteApp: boolean };

export type RegenerateApiKeyMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RegenerateApiKeyMutation = { __typename?: 'Mutation', regenerateApiKey: { __typename?: 'App', id: string, apiKey: string, updatedAt: string } };

export type ConfigureApNsMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ConfigureApNsInput;
}>;


export type ConfigureApNsMutation = { __typename?: 'Mutation', configureAPNs: { __typename?: 'App', id: string, apnsKeyId?: string | null | undefined, apnsTeamId?: string | null | undefined, updatedAt: string } };

export type ConfigureFcmMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ConfigureFcmInput;
}>;


export type ConfigureFcmMutation = { __typename?: 'Mutation', configureFCM: { __typename?: 'App', id: string, fcmProjectId?: string | null | undefined, updatedAt: string } };

export type ConfigureWebPushMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ConfigureWebPushInput;
}>;


export type ConfigureWebPushMutation = { __typename?: 'Mutation', configureWebPush: { __typename?: 'App', id: string, vapidSubject?: string | null | undefined, vapidPublicKey?: string | null | undefined, updatedAt: string } };

export type AppsQueryVariables = Exact<{ [key: string]: never; }>;


export type AppsQuery = { __typename?: 'Query', apps: Array<{ __typename?: 'App', id: string, name: string, slug: string, description?: string | null | undefined, isActive: boolean, apiKey: string, fcmProjectId?: string | null | undefined, fcmServiceAccount?: string | null | undefined, apnsKeyId?: string | null | undefined, apnsTeamId?: string | null | undefined, apnsPrivateKey?: string | null | undefined, bundleId?: string | null | undefined, vapidSubject?: string | null | undefined, vapidPublicKey?: string | null | undefined, vapidPrivateKey?: string | null | undefined, createdAt: string, updatedAt: string, stats?: { __typename?: 'AppStats', totalDevices: number, activeDevices: number, newDevicesToday: number, sentToday: number, deliveryRate: number, apiCalls: number } | null | undefined }> };

export type AppQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AppQuery = { __typename?: 'Query', app?: { __typename?: 'App', id: string, name: string, slug: string, description?: string | null | undefined, isActive: boolean, apiKey: string, fcmProjectId?: string | null | undefined, fcmServiceAccount?: string | null | undefined, apnsKeyId?: string | null | undefined, apnsTeamId?: string | null | undefined, apnsPrivateKey?: string | null | undefined, bundleId?: string | null | undefined, vapidSubject?: string | null | undefined, vapidPublicKey?: string | null | undefined, vapidPrivateKey?: string | null | undefined, createdAt: string, updatedAt: string, stats?: { __typename?: 'AppStats', totalDevices: number, activeDevices: number, newDevicesToday: number, sentToday: number, deliveryRate: number, apiCalls: number } | null | undefined } | null | undefined };

export type AppBySlugQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type AppBySlugQuery = { __typename?: 'Query', appBySlug?: { __typename?: 'App', id: string, name: string, slug: string, description?: string | null | undefined, isActive: boolean, apiKey: string, createdAt: string, updatedAt: string } | null | undefined };

export type AppExistsQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type AppExistsQuery = { __typename?: 'Query', appExists: boolean };

export type GenerateVapidKeysQueryVariables = Exact<{ [key: string]: never; }>;


export type GenerateVapidKeysQuery = { __typename?: 'Query', generateVapidKeys: { __typename?: 'VapidKeys', publicKey: string, privateKey: string } };

export type RegisterDeviceMutationVariables = Exact<{
  input: RegisterDeviceInput;
}>;


export type RegisterDeviceMutation = { __typename?: 'Mutation', registerDevice: { __typename?: 'Device', id: string, appId: string, token: string, platform: DevicePlatform, userId?: string | null | undefined, status: DeviceStatus, metadata?: any | null | undefined, lastSeenAt?: string | null | undefined, createdAt: string, updatedAt: string } };

export type UpdateDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}>;


export type UpdateDeviceMutation = { __typename?: 'Mutation', updateDevice: { __typename?: 'Device', id: string, appId: string, token: string, platform: DevicePlatform, userId?: string | null | undefined, status: DeviceStatus, metadata?: any | null | undefined, lastSeenAt?: string | null | undefined, updatedAt: string } };

export type DeleteDeviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteDeviceMutation = { __typename?: 'Mutation', deleteDevice: boolean };

export type DevicesQueryVariables = Exact<{
  appId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type DevicesQuery = { __typename?: 'Query', devices: Array<{ __typename?: 'Device', id: string, appId: string, token: string, category?: DeviceCategory | null | undefined, platform: DevicePlatform, userId?: string | null | undefined, status: DeviceStatus, metadata?: any | null | undefined, lastSeenAt?: string | null | undefined, createdAt: string, updatedAt: string }> };

export type DeviceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeviceQuery = { __typename?: 'Query', device?: { __typename?: 'Device', id: string, appId: string, token: string, category?: DeviceCategory | null | undefined, platform: DevicePlatform, userId?: string | null | undefined, status: DeviceStatus, metadata?: any | null | undefined, lastSeenAt?: string | null | undefined, createdAt: string, updatedAt: string } | null | undefined };

export type DeviceByTokenQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type DeviceByTokenQuery = { __typename?: 'Query', deviceByToken?: { __typename?: 'Device', id: string, appId: string, token: string, category?: DeviceCategory | null | undefined, platform: DevicePlatform, userId?: string | null | undefined, status: DeviceStatus, metadata?: any | null | undefined, lastSeenAt?: string | null | undefined, createdAt: string, updatedAt: string } | null | undefined };

export type SendNotificationMutationVariables = Exact<{
  input: SendNotificationInput;
}>;


export type SendNotificationMutation = { __typename?: 'Mutation', sendNotification: { __typename?: 'Notification', id: string, appId: string, title: string, body: string, data?: any | null | undefined, badge?: number | null | undefined, sound?: string | null | undefined, clickAction?: string | null | undefined, imageUrl?: string | null | undefined, targetDevices?: any | null | undefined, platforms?: any | null | undefined, scheduledAt?: string | null | undefined, status: NotificationStatus, totalTargets: number, totalSent: number, totalDelivered: number, totalFailed: number, totalClicked: number, createdAt: string, updatedAt: string, sentAt?: string | null | undefined } };

export type NotificationsQueryVariables = Exact<{
  appId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type NotificationsQuery = { __typename?: 'Query', notifications: Array<{ __typename?: 'Notification', id: string, appId: string, title: string, body: string, data?: any | null | undefined, badge?: number | null | undefined, sound?: string | null | undefined, clickAction?: string | null | undefined, imageUrl?: string | null | undefined, targetDevices?: any | null | undefined, platforms?: any | null | undefined, scheduledAt?: string | null | undefined, status: NotificationStatus, totalTargets: number, totalSent: number, totalDelivered: number, totalFailed: number, totalClicked: number, createdAt: string, updatedAt: string, sentAt?: string | null | undefined }> };

export type NotificationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type NotificationQuery = { __typename?: 'Query', notification?: { __typename?: 'Notification', id: string, appId: string, title: string, body: string, data?: any | null | undefined, badge?: number | null | undefined, sound?: string | null | undefined, clickAction?: string | null | undefined, imageUrl?: string | null | undefined, targetDevices?: any | null | undefined, platforms?: any | null | undefined, scheduledAt?: string | null | undefined, status: NotificationStatus, totalTargets: number, totalSent: number, totalDelivered: number, totalFailed: number, totalClicked: number, createdAt: string, updatedAt: string, sentAt?: string | null | undefined, deliveryLogs?: Array<{ __typename?: 'DeliveryLog', id: string, deviceId: string, status: DeliveryStatus, errorMessage?: string | null | undefined, createdAt: string, clickedAt?: string | null | undefined }> | null | undefined } | null | undefined };

export type DeliveryLogsQueryVariables = Exact<{
  notificationId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type DeliveryLogsQuery = { __typename?: 'Query', deliveryLogs: Array<{ __typename?: 'DeliveryLog', id: string, notificationId: string, deviceId: string, status: DeliveryStatus, errorMessage?: string | null | undefined, clickedAt?: string | null | undefined, createdAt: string, updatedAt: string }> };

export type DashboardStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardStatsQuery = { __typename?: 'Query', dashboardStats: { __typename?: 'DashboardStats', totalApps: number, activeDevices: number, notificationsSent: number, deliveryRate: number } };
