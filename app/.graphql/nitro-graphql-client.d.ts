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

export type Channel = {
  __typename?: 'Channel';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: ChannelType;
  config?: Maybe<Scalars['JSON']['output']>;
  isActive: Scalars['Boolean']['output'];
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
};

export type ChannelType =
  | 'PUSH'
  | 'EMAIL'
  | 'SMS'
  | 'IN_APP'
  | 'DISCORD';

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

export type Contact = {
  __typename?: 'Contact';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  externalId: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  devices?: Maybe<Array<Device>>;
  preferences?: Maybe<Array<ContactPreference>>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
};

export type ContactPreference = {
  __typename?: 'ContactPreference';
  id: Scalars['ID']['output'];
  subscriberId: Scalars['ID']['output'];
  category: Scalars['String']['output'];
  channelType: ChannelType;
  enabled: Scalars['Boolean']['output'];
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
};

export type CreateAppInput = {
  name: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
};

export type CreateChannelInput = {
  appId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  type: ChannelType;
  config?: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateContactInput = {
  appId: Scalars['ID']['input'];
  externalId: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateHookInput = {
  appId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  url: Scalars['String']['input'];
  secret?: InputMaybe<Scalars['String']['input']>;
  events?: InputMaybe<Scalars['JSON']['input']>;
};

export type CreateTemplateInput = {
  appId: Scalars['ID']['input'];
  channelId?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  channelType: ChannelType;
  subject?: InputMaybe<Scalars['String']['input']>;
  body: Scalars['String']['input'];
  htmlBody?: InputMaybe<Scalars['String']['input']>;
};

export type CreateWorkflowInput = {
  appId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  triggerIdentifier: Scalars['String']['input'];
  triggerType?: InputMaybe<WorkflowTriggerType>;
  steps?: InputMaybe<Array<WorkflowStepInput>>;
  flowLayout?: InputMaybe<Scalars['JSON']['input']>;
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

export type Hook = {
  __typename?: 'Hook';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  url: Scalars['String']['output'];
  secret?: Maybe<Scalars['String']['output']>;
  events?: Maybe<Scalars['JSON']['output']>;
  isActive: Scalars['Boolean']['output'];
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
};

export type HookEvent =
  | 'NOTIFICATION_SENT'
  | 'NOTIFICATION_DELIVERED'
  | 'NOTIFICATION_FAILED'
  | 'NOTIFICATION_CLICKED'
  | 'WORKFLOW_COMPLETED'
  | 'WORKFLOW_FAILED';

export type InAppMessage = {
  __typename?: 'InAppMessage';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  contactId: Scalars['ID']['output'];
  notificationId?: Maybe<Scalars['ID']['output']>;
  title: Scalars['String']['output'];
  body: Scalars['String']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  isRead: Scalars['Boolean']['output'];
  readAt?: Maybe<Scalars['Timestamp']['output']>;
  createdAt: Scalars['Timestamp']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  cancelNotification: Scalars['Boolean']['output'];
  configureAPNs: App;
  configureFCM: App;
  configureWebPush: App;
  createApp: App;
  createChannel: Channel;
  createContact: Contact;
  createHook: Hook;
  createTemplate: Template;
  createWorkflow: Workflow;
  deleteApp: Scalars['Boolean']['output'];
  deleteChannel: Scalars['Boolean']['output'];
  deleteContact: Scalars['Boolean']['output'];
  deleteDevice: Scalars['Boolean']['output'];
  deleteHook: Scalars['Boolean']['output'];
  deleteTemplate: Scalars['Boolean']['output'];
  deleteWorkflow: Scalars['Boolean']['output'];
  markInAppMessageRead: Scalars['Boolean']['output'];
  regenerateApiKey: App;
  registerDevice: Device;
  scheduleNotification: Notification;
  sendNotification: Notification;
  trackNotificationClicked: TrackEventResponse;
  trackNotificationDelivered: TrackEventResponse;
  trackNotificationOpened: TrackEventResponse;
  triggerWorkflow: WorkflowExecution;
  updateApp: App;
  updateChannel: Channel;
  updateContact: Contact;
  updateContactPreference: ContactPreference;
  updateDevice: Device;
  updateHook: Hook;
  updateTemplate: Template;
  updateWorkflow: Workflow;
  upsertContactDevice: Scalars['Boolean']['output'];
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


export type MutationCreateChannelArgs = {
  input: CreateChannelInput;
};


export type MutationCreateContactArgs = {
  input: CreateContactInput;
};


export type MutationCreateHookArgs = {
  input: CreateHookInput;
};


export type MutationCreateTemplateArgs = {
  input: CreateTemplateInput;
};


export type MutationCreateWorkflowArgs = {
  input: CreateWorkflowInput;
};


export type MutationDeleteAppArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteChannelArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteContactArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDeviceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteHookArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteWorkflowArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMarkInAppMessageReadArgs = {
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


export type MutationTriggerWorkflowArgs = {
  input: TriggerWorkflowInput;
};


export type MutationUpdateAppArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAppInput;
};


export type MutationUpdateChannelArgs = {
  id: Scalars['ID']['input'];
  input: UpdateChannelInput;
};


export type MutationUpdateContactArgs = {
  id: Scalars['ID']['input'];
  input: UpdateContactInput;
};


export type MutationUpdateContactPreferenceArgs = {
  input: UpdateContactPreferenceInput;
};


export type MutationUpdateDeviceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
};


export type MutationUpdateHookArgs = {
  id: Scalars['ID']['input'];
  input: UpdateHookInput;
};


export type MutationUpdateTemplateArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTemplateInput;
};


export type MutationUpdateWorkflowArgs = {
  id: Scalars['ID']['input'];
  input: UpdateWorkflowInput;
};


export type MutationUpsertContactDeviceArgs = {
  input: UpsertContactDeviceInput;
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
  channel?: Maybe<Channel>;
  channels: Array<Channel>;
  contact?: Maybe<Contact>;
  contactByExternalId?: Maybe<Contact>;
  contacts: Array<Contact>;
  dashboardStats: DashboardStats;
  deliveryLogs: Array<DeliveryLog>;
  device?: Maybe<Device>;
  deviceByToken?: Maybe<Device>;
  devices: Array<Device>;
  generateVapidKeys: VapidKeys;
  getEngagementMetrics?: Maybe<EngagementMetrics>;
  getNotificationAnalytics?: Maybe<NotificationAnalytics>;
  hook?: Maybe<Hook>;
  hooks: Array<Hook>;
  inAppMessages: Array<InAppMessage>;
  notification?: Maybe<Notification>;
  notifications: Array<Notification>;
  platformStats: Array<PlatformStats>;
  template?: Maybe<Template>;
  templates: Array<Template>;
  unreadInAppCount: Scalars['Int']['output'];
  workflow?: Maybe<Workflow>;
  workflowExecutions: Array<WorkflowExecution>;
  workflows: Array<Workflow>;
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


export type QueryChannelArgs = {
  id: Scalars['ID']['input'];
};


export type QueryChannelsArgs = {
  appId: Scalars['ID']['input'];
  type?: InputMaybe<ChannelType>;
};


export type QueryContactArgs = {
  id: Scalars['ID']['input'];
};


export type QueryContactByExternalIdArgs = {
  appId: Scalars['ID']['input'];
  externalId: Scalars['String']['input'];
};


export type QueryContactsArgs = {
  appId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
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


export type QueryHookArgs = {
  id: Scalars['ID']['input'];
};


export type QueryHooksArgs = {
  appId: Scalars['ID']['input'];
};


export type QueryInAppMessagesArgs = {
  contactId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
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


export type QueryTemplateArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTemplatesArgs = {
  appId: Scalars['ID']['input'];
  channelType?: InputMaybe<ChannelType>;
};


export type QueryUnreadInAppCountArgs = {
  contactId: Scalars['ID']['input'];
};


export type QueryWorkflowArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorkflowExecutionsArgs = {
  workflowId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryWorkflowsArgs = {
  appId: Scalars['ID']['input'];
  status?: InputMaybe<WorkflowStatus>;
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
  channelType?: InputMaybe<ChannelType>;
  channelId?: InputMaybe<Scalars['ID']['input']>;
  contactIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type Template = {
  __typename?: 'Template';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  channelId?: Maybe<Scalars['ID']['output']>;
  name: Scalars['String']['output'];
  channelType: ChannelType;
  subject?: Maybe<Scalars['String']['output']>;
  body: Scalars['String']['output'];
  htmlBody?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
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

export type TriggerWorkflowInput = {
  workflowId: Scalars['ID']['input'];
  subscriberId?: InputMaybe<Scalars['ID']['input']>;
  payload?: InputMaybe<Scalars['JSON']['input']>;
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

export type UpdateChannelInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  config?: InputMaybe<Scalars['JSON']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateContactInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateContactPreferenceInput = {
  subscriberId: Scalars['ID']['input'];
  category: Scalars['String']['input'];
  channelType: ChannelType;
  enabled: Scalars['Boolean']['input'];
};

export type UpdateDeviceInput = {
  status?: InputMaybe<DeviceStatus>;
  userId?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpdateHookInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  secret?: InputMaybe<Scalars['String']['input']>;
  events?: InputMaybe<Scalars['JSON']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateTemplateInput = {
  channelId?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
  body?: InputMaybe<Scalars['String']['input']>;
  htmlBody?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWorkflowInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  triggerIdentifier?: InputMaybe<Scalars['String']['input']>;
  triggerType?: InputMaybe<WorkflowTriggerType>;
  status?: InputMaybe<WorkflowStatus>;
  steps?: InputMaybe<Array<WorkflowStepInput>>;
  flowLayout?: InputMaybe<Scalars['JSON']['input']>;
};

export type UpsertContactDeviceInput = {
  subscriberId: Scalars['ID']['input'];
  deviceId: Scalars['ID']['input'];
};

export type VapidKeys = {
  __typename?: 'VapidKeys';
  publicKey: Scalars['String']['output'];
  privateKey: Scalars['String']['output'];
};

export type Workflow = {
  __typename?: 'Workflow';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  triggerIdentifier: Scalars['String']['output'];
  triggerType: WorkflowTriggerType;
  status: WorkflowStatus;
  flowLayout?: Maybe<Scalars['JSON']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
  steps?: Maybe<Array<WorkflowStep>>;
};

export type WorkflowExecution = {
  __typename?: 'WorkflowExecution';
  id: Scalars['ID']['output'];
  workflowId: Scalars['ID']['output'];
  subscriberId?: Maybe<Scalars['ID']['output']>;
  triggerIdentifier: Scalars['String']['output'];
  payload?: Maybe<Scalars['JSON']['output']>;
  status: WorkflowExecutionStatus;
  currentStepOrder: Scalars['Int']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  startedAt: Scalars['Timestamp']['output'];
  completedAt?: Maybe<Scalars['Timestamp']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
};

export type WorkflowExecutionStatus =
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type WorkflowStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ARCHIVED';

export type WorkflowStep = {
  __typename?: 'WorkflowStep';
  id: Scalars['ID']['output'];
  workflowId: Scalars['ID']['output'];
  nodeId?: Maybe<Scalars['String']['output']>;
  type: WorkflowStepType;
  order: Scalars['Int']['output'];
  config?: Maybe<Scalars['JSON']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
};

export type WorkflowStepInput = {
  nodeId?: InputMaybe<Scalars['String']['input']>;
  type: WorkflowStepType;
  order: Scalars['Int']['input'];
  config?: InputMaybe<Scalars['JSON']['input']>;
};

export type WorkflowStepType =
  | 'SEND'
  | 'DELAY'
  | 'FILTER'
  | 'DIGEST'
  | 'BRANCH';

export type WorkflowTriggerType =
  | 'EVENT'
  | 'SCHEDULED'
  | 'MANUAL';

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

export type CreateChannelMutationVariables = Exact<{
  input: CreateChannelInput;
}>;


export type CreateChannelMutation = { __typename?: 'Mutation', createChannel: { __typename?: 'Channel', id: string, appId: string, name: string, type: ChannelType, isActive: boolean, createdAt: string, updatedAt: string } };

export type UpdateChannelMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateChannelInput;
}>;


export type UpdateChannelMutation = { __typename?: 'Mutation', updateChannel: { __typename?: 'Channel', id: string, name: string, type: ChannelType, isActive: boolean, updatedAt: string } };

export type DeleteChannelMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteChannelMutation = { __typename?: 'Mutation', deleteChannel: boolean };

export type ChannelsQueryVariables = Exact<{
  appId: Scalars['ID']['input'];
  type?: InputMaybe<ChannelType>;
}>;


export type ChannelsQuery = { __typename?: 'Query', channels: Array<{ __typename?: 'Channel', id: string, appId: string, name: string, type: ChannelType, isActive: boolean, createdAt: string, updatedAt: string }> };

export type ChannelQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ChannelQuery = { __typename?: 'Query', channel?: { __typename?: 'Channel', id: string, appId: string, name: string, type: ChannelType, isActive: boolean, createdAt: string, updatedAt: string } | null | undefined };

export type CreateContactMutationVariables = Exact<{
  input: CreateContactInput;
}>;


export type CreateContactMutation = { __typename?: 'Mutation', createContact: { __typename?: 'Contact', id: string, appId: string, externalId: string, name?: string | null | undefined, email?: string | null | undefined, phone?: string | null | undefined, locale?: string | null | undefined, createdAt: string, updatedAt: string } };

export type UpdateContactMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateContactInput;
}>;


export type UpdateContactMutation = { __typename?: 'Mutation', updateContact: { __typename?: 'Contact', id: string, externalId: string, name?: string | null | undefined, email?: string | null | undefined, phone?: string | null | undefined, locale?: string | null | undefined, updatedAt: string } };

export type DeleteContactMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteContactMutation = { __typename?: 'Mutation', deleteContact: boolean };

export type UpsertContactDeviceMutationVariables = Exact<{
  input: UpsertContactDeviceInput;
}>;


export type UpsertContactDeviceMutation = { __typename?: 'Mutation', upsertContactDevice: boolean };

export type UpdateContactPreferenceMutationVariables = Exact<{
  input: UpdateContactPreferenceInput;
}>;


export type UpdateContactPreferenceMutation = { __typename?: 'Mutation', updateContactPreference: { __typename?: 'ContactPreference', id: string, subscriberId: string, category: string, channelType: ChannelType, enabled: boolean, updatedAt: string } };

export type ContactsQueryVariables = Exact<{
  appId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ContactsQuery = { __typename?: 'Query', contacts: Array<{ __typename?: 'Contact', id: string, appId: string, externalId: string, name?: string | null | undefined, email?: string | null | undefined, phone?: string | null | undefined, locale?: string | null | undefined, metadata?: any | null | undefined, createdAt: string, updatedAt: string }> };

export type ContactQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ContactQuery = { __typename?: 'Query', contact?: { __typename?: 'Contact', id: string, appId: string, externalId: string, name?: string | null | undefined, email?: string | null | undefined, phone?: string | null | undefined, locale?: string | null | undefined, metadata?: any | null | undefined, createdAt: string, updatedAt: string, preferences?: Array<{ __typename?: 'ContactPreference', id: string, subscriberId: string, category: string, channelType: ChannelType, enabled: boolean, updatedAt: string }> | null | undefined } | null | undefined };

export type ContactByExternalIdQueryVariables = Exact<{
  appId: Scalars['ID']['input'];
  externalId: Scalars['String']['input'];
}>;


export type ContactByExternalIdQuery = { __typename?: 'Query', contactByExternalId?: { __typename?: 'Contact', id: string, appId: string, externalId: string, name?: string | null | undefined, email?: string | null | undefined, phone?: string | null | undefined, locale?: string | null | undefined, metadata?: any | null | undefined, createdAt: string, updatedAt: string } | null | undefined };

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

export type CreateHookMutationVariables = Exact<{
  input: CreateHookInput;
}>;


export type CreateHookMutation = { __typename?: 'Mutation', createHook: { __typename?: 'Hook', id: string, appId: string, name: string, url: string, events?: any | null | undefined, isActive: boolean, createdAt: string, updatedAt: string } };

export type UpdateHookMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateHookInput;
}>;


export type UpdateHookMutation = { __typename?: 'Mutation', updateHook: { __typename?: 'Hook', id: string, name: string, url: string, events?: any | null | undefined, isActive: boolean, updatedAt: string } };

export type DeleteHookMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteHookMutation = { __typename?: 'Mutation', deleteHook: boolean };

export type HooksQueryVariables = Exact<{
  appId: Scalars['ID']['input'];
}>;


export type HooksQuery = { __typename?: 'Query', hooks: Array<{ __typename?: 'Hook', id: string, appId: string, name: string, url: string, events?: any | null | undefined, isActive: boolean, createdAt: string, updatedAt: string }> };

export type HookQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type HookQuery = { __typename?: 'Query', hook?: { __typename?: 'Hook', id: string, appId: string, name: string, url: string, events?: any | null | undefined, isActive: boolean, createdAt: string, updatedAt: string } | null | undefined };

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

export type CreateTemplateMutationVariables = Exact<{
  input: CreateTemplateInput;
}>;


export type CreateTemplateMutation = { __typename?: 'Mutation', createTemplate: { __typename?: 'Template', id: string, appId: string, channelId?: string | null | undefined, name: string, channelType: ChannelType, subject?: string | null | undefined, body: string, htmlBody?: string | null | undefined, createdAt: string, updatedAt: string } };

export type UpdateTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateTemplateInput;
}>;


export type UpdateTemplateMutation = { __typename?: 'Mutation', updateTemplate: { __typename?: 'Template', id: string, name: string, subject?: string | null | undefined, body: string, htmlBody?: string | null | undefined, updatedAt: string } };

export type DeleteTemplateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTemplateMutation = { __typename?: 'Mutation', deleteTemplate: boolean };

export type TemplatesQueryVariables = Exact<{
  appId: Scalars['ID']['input'];
  channelType?: InputMaybe<ChannelType>;
}>;


export type TemplatesQuery = { __typename?: 'Query', templates: Array<{ __typename?: 'Template', id: string, appId: string, channelId?: string | null | undefined, name: string, channelType: ChannelType, subject?: string | null | undefined, body: string, htmlBody?: string | null | undefined, createdAt: string, updatedAt: string }> };

export type TemplateQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TemplateQuery = { __typename?: 'Query', template?: { __typename?: 'Template', id: string, appId: string, channelId?: string | null | undefined, name: string, channelType: ChannelType, subject?: string | null | undefined, body: string, htmlBody?: string | null | undefined, createdAt: string, updatedAt: string } | null | undefined };

export type CreateWorkflowMutationVariables = Exact<{
  input: CreateWorkflowInput;
}>;


export type CreateWorkflowMutation = { __typename?: 'Mutation', createWorkflow: { __typename?: 'Workflow', id: string, appId: string, name: string, triggerIdentifier: string, triggerType: WorkflowTriggerType, status: WorkflowStatus, flowLayout?: any | null | undefined, createdAt: string, updatedAt: string } };

export type UpdateWorkflowMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateWorkflowInput;
}>;


export type UpdateWorkflowMutation = { __typename?: 'Mutation', updateWorkflow: { __typename?: 'Workflow', id: string, name: string, triggerIdentifier: string, triggerType: WorkflowTriggerType, status: WorkflowStatus, flowLayout?: any | null | undefined, updatedAt: string, steps?: Array<{ __typename?: 'WorkflowStep', id: string, nodeId?: string | null | undefined, type: WorkflowStepType, order: number, config?: any | null | undefined }> | null | undefined } };

export type DeleteWorkflowMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteWorkflowMutation = { __typename?: 'Mutation', deleteWorkflow: boolean };

export type TriggerWorkflowMutationVariables = Exact<{
  input: TriggerWorkflowInput;
}>;


export type TriggerWorkflowMutation = { __typename?: 'Mutation', triggerWorkflow: { __typename?: 'WorkflowExecution', id: string, workflowId: string, status: WorkflowExecutionStatus, triggerIdentifier: string, startedAt: string, createdAt: string } };

export type WorkflowsQueryVariables = Exact<{
  appId: Scalars['ID']['input'];
  status?: InputMaybe<WorkflowStatus>;
}>;


export type WorkflowsQuery = { __typename?: 'Query', workflows: Array<{ __typename?: 'Workflow', id: string, appId: string, name: string, triggerIdentifier: string, triggerType: WorkflowTriggerType, status: WorkflowStatus, flowLayout?: any | null | undefined, createdAt: string, updatedAt: string, steps?: Array<{ __typename?: 'WorkflowStep', id: string, nodeId?: string | null | undefined, type: WorkflowStepType, order: number, config?: any | null | undefined }> | null | undefined }> };

export type WorkflowQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type WorkflowQuery = { __typename?: 'Query', workflow?: { __typename?: 'Workflow', id: string, appId: string, name: string, triggerIdentifier: string, triggerType: WorkflowTriggerType, status: WorkflowStatus, flowLayout?: any | null | undefined, createdAt: string, updatedAt: string, steps?: Array<{ __typename?: 'WorkflowStep', id: string, nodeId?: string | null | undefined, type: WorkflowStepType, order: number, config?: any | null | undefined }> | null | undefined } | null | undefined };

export type WorkflowExecutionsQueryVariables = Exact<{
  workflowId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type WorkflowExecutionsQuery = { __typename?: 'Query', workflowExecutions: Array<{ __typename?: 'WorkflowExecution', id: string, workflowId: string, subscriberId?: string | null | undefined, triggerIdentifier: string, payload?: any | null | undefined, status: WorkflowExecutionStatus, currentStepOrder: number, errorMessage?: string | null | undefined, startedAt: string, completedAt?: string | null | undefined, createdAt: string, updatedAt: string }> };
