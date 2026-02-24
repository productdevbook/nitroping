// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable eslint-comments/no-unlimited-disable */
/* tslint:disable */
/* eslint-disable */
/* prettier-ignore */
import schemas from '#nitro-graphql/validation-schemas'
import type { StandardSchemaV1 } from 'nitro-graphql/types'
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { H3Event } from 'nitro/h3';

export interface NPMConfig {
  framework: 'graphql-yoga';
}

export type SchemaType = Partial<Record<Partial<keyof ResolversTypes>, StandardSchemaV1>>

// Check if schemas is empty object, return never if so
type SafeSchemaKeys<T> = T extends Record<PropertyKey, never>
  ? never
  : keyof T extends string | number | symbol
    ? keyof T extends never
      ? never
      : keyof T
    : never;


type SchemaKeys = SafeSchemaKeys<typeof schemas>;

type InferInput<T> = T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : unknown;
type InferOutput<T> = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : unknown;

type InferInputFromSchema<T extends SchemaKeys> = InferInput<(typeof schemas)[T]>;
type InferOutputFromSchema<T extends SchemaKeys> = InferOutput<(typeof schemas)[T]>;

type Primitive =
| null
| undefined
| string
| number
| boolean
| symbol
| bigint;

type BuiltIns = Primitive | void | Date | RegExp;


type ResolverReturnType<T> = T extends BuiltIns
? T
: T extends (...args: any[]) => unknown
? T | undefined
: T extends object
? T extends Array<infer ItemType> // Test for arrays/tuples, per https://github.com/microsoft/TypeScript/issues/35156
  ? ItemType[] extends T // Test for arrays (non-tuples) specifically
    ? Array<ResolverReturnType<ItemType>>
    : ResolverReturnTypeObject<T> // Tuples behave properly
  : ResolverReturnTypeObject<T>
: unknown;

type ResolverReturnTypeObject<T extends object> =
  T extends { __typename?: infer TTypename }
    ? TTypename extends SchemaKeys
      ? InferOutputFromSchema<TTypename>
      : { [K in keyof T]: ResolverReturnType<T[K]> }
    : { [K in keyof T]: ResolverReturnType<T[K]> };

export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
  Timestamp: { input: string; output: string; }
}

export interface AnalyticsData {
  __typename?: 'AnalyticsData';
  date: Scalars['String']['output'];
  sent: Scalars['Int']['output'];
  delivered: Scalars['Int']['output'];
  failed: Scalars['Int']['output'];
  clicked: Scalars['Int']['output'];
}

export interface ApiKey {
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
}

export interface App {
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
}

export interface AppStats {
  __typename?: 'AppStats';
  totalDevices: Scalars['Int']['output'];
  activeDevices: Scalars['Int']['output'];
  newDevicesToday: Scalars['Int']['output'];
  sentToday: Scalars['Int']['output'];
  deliveryRate: Scalars['Float']['output'];
  apiCalls: Scalars['Int']['output'];
}

export interface Channel {
  __typename?: 'Channel';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: ChannelType;
  config?: Maybe<Scalars['JSON']['output']>;
  isActive: Scalars['Boolean']['output'];
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
}

export type ChannelType =
  | 'PUSH'
  | 'EMAIL'
  | 'SMS'
  | 'IN_APP';

export interface ConfigureApNsInput {
  keyId: Scalars['String']['input'];
  teamId: Scalars['String']['input'];
  privateKey: Scalars['String']['input'];
  bundleId?: InputMaybe<Scalars['String']['input']>;
  isProduction?: InputMaybe<Scalars['Boolean']['input']>;
}

export interface ConfigureFcmInput {
  projectId: Scalars['String']['input'];
  serviceAccount: Scalars['String']['input'];
}

export interface ConfigureWebPushInput {
  subject: Scalars['String']['input'];
  publicKey: Scalars['String']['input'];
  privateKey: Scalars['String']['input'];
}

export interface Contact {
  __typename?: 'Contact';
  id: Scalars['ID']['output'];
  appId: Scalars['ID']['output'];
  externalId: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  devices?: Maybe<Array<Device>>;
  preferences?: Maybe<Array<ContactPreference>>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
}

export interface ContactPreference {
  __typename?: 'ContactPreference';
  id: Scalars['ID']['output'];
  subscriberId: Scalars['ID']['output'];
  category: Scalars['String']['output'];
  channelType: ChannelType;
  enabled: Scalars['Boolean']['output'];
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
}

export interface CreateAppInput {
  name: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
}

export interface CreateChannelInput {
  appId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  type: ChannelType;
  config?: InputMaybe<Scalars['JSON']['input']>;
}

export interface CreateContactInput {
  appId: Scalars['ID']['input'];
  externalId: Scalars['String']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
}

export interface CreateHookInput {
  appId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  url: Scalars['String']['input'];
  secret?: InputMaybe<Scalars['String']['input']>;
  events?: InputMaybe<Scalars['JSON']['input']>;
}

export interface CreateTemplateInput {
  appId: Scalars['ID']['input'];
  channelId?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  channelType: ChannelType;
  subject?: InputMaybe<Scalars['String']['input']>;
  body: Scalars['String']['input'];
  htmlBody?: InputMaybe<Scalars['String']['input']>;
}

export interface CreateWorkflowInput {
  appId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  triggerIdentifier: Scalars['String']['input'];
  triggerType?: InputMaybe<WorkflowTriggerType>;
  steps?: InputMaybe<Array<WorkflowStepInput>>;
  flowLayout?: InputMaybe<Scalars['JSON']['input']>;
}

export interface DashboardStats {
  __typename?: 'DashboardStats';
  totalApps: Scalars['Int']['output'];
  activeDevices: Scalars['Int']['output'];
  notificationsSent: Scalars['Int']['output'];
  deliveryRate: Scalars['Float']['output'];
}

export interface DeliveryLog {
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
}

export type DeliveryStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CLICKED';

export interface Device {
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
}

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

export interface EngagementMetrics {
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
}

export interface Hook {
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
}

export type HookEvent =
  | 'NOTIFICATION_SENT'
  | 'NOTIFICATION_DELIVERED'
  | 'NOTIFICATION_FAILED'
  | 'NOTIFICATION_CLICKED'
  | 'WORKFLOW_COMPLETED'
  | 'WORKFLOW_FAILED';

export interface Mutation {
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
}


export interface MutationCancelNotificationArgs {
  id: Scalars['ID']['input'];
}


export interface MutationConfigureApNsArgs {
  id: Scalars['ID']['input'];
  input: ConfigureApNsInput;
}


export interface MutationConfigureFcmArgs {
  id: Scalars['ID']['input'];
  input: ConfigureFcmInput;
}


export interface MutationConfigureWebPushArgs {
  id: Scalars['ID']['input'];
  input: ConfigureWebPushInput;
}


export interface MutationCreateAppArgs {
  input: CreateAppInput;
}


export interface MutationCreateChannelArgs {
  input: CreateChannelInput;
}


export interface MutationCreateContactArgs {
  input: CreateContactInput;
}


export interface MutationCreateHookArgs {
  input: CreateHookInput;
}


export interface MutationCreateTemplateArgs {
  input: CreateTemplateInput;
}


export interface MutationCreateWorkflowArgs {
  input: CreateWorkflowInput;
}


export interface MutationDeleteAppArgs {
  id: Scalars['ID']['input'];
}


export interface MutationDeleteChannelArgs {
  id: Scalars['ID']['input'];
}


export interface MutationDeleteContactArgs {
  id: Scalars['ID']['input'];
}


export interface MutationDeleteDeviceArgs {
  id: Scalars['ID']['input'];
}


export interface MutationDeleteHookArgs {
  id: Scalars['ID']['input'];
}


export interface MutationDeleteTemplateArgs {
  id: Scalars['ID']['input'];
}


export interface MutationDeleteWorkflowArgs {
  id: Scalars['ID']['input'];
}


export interface MutationRegenerateApiKeyArgs {
  id: Scalars['ID']['input'];
}


export interface MutationRegisterDeviceArgs {
  input: RegisterDeviceInput;
}


export interface MutationScheduleNotificationArgs {
  input: SendNotificationInput;
}


export interface MutationSendNotificationArgs {
  input: SendNotificationInput;
}


export interface MutationTrackNotificationClickedArgs {
  input: TrackEventInput;
}


export interface MutationTrackNotificationDeliveredArgs {
  input: TrackEventInput;
}


export interface MutationTrackNotificationOpenedArgs {
  input: TrackEventInput;
}


export interface MutationTriggerWorkflowArgs {
  input: TriggerWorkflowInput;
}


export interface MutationUpdateAppArgs {
  id: Scalars['ID']['input'];
  input: UpdateAppInput;
}


export interface MutationUpdateChannelArgs {
  id: Scalars['ID']['input'];
  input: UpdateChannelInput;
}


export interface MutationUpdateContactArgs {
  id: Scalars['ID']['input'];
  input: UpdateContactInput;
}


export interface MutationUpdateContactPreferenceArgs {
  input: UpdateContactPreferenceInput;
}


export interface MutationUpdateDeviceArgs {
  id: Scalars['ID']['input'];
  input: UpdateDeviceInput;
}


export interface MutationUpdateHookArgs {
  id: Scalars['ID']['input'];
  input: UpdateHookInput;
}


export interface MutationUpdateTemplateArgs {
  id: Scalars['ID']['input'];
  input: UpdateTemplateInput;
}


export interface MutationUpdateWorkflowArgs {
  id: Scalars['ID']['input'];
  input: UpdateWorkflowInput;
}


export interface MutationUpsertContactDeviceArgs {
  input: UpsertContactDeviceInput;
}

export interface Notification {
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
}

export interface NotificationAnalytics {
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
}

export type NotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'SCHEDULED';

export interface PageInfo {
  __typename?: 'PageInfo';
  page: Scalars['Int']['output'];
  limit: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
  endCursor?: Maybe<Scalars['String']['output']>;
}

export interface PlatformMetrics {
  __typename?: 'PlatformMetrics';
  platform: Scalars['String']['output'];
  sent: Scalars['Int']['output'];
  delivered: Scalars['Int']['output'];
  opened: Scalars['Int']['output'];
  clicked: Scalars['Int']['output'];
  avgDeliveryTime?: Maybe<Scalars['Float']['output']>;
  avgOpenTime?: Maybe<Scalars['Float']['output']>;
}

export interface PlatformStats {
  __typename?: 'PlatformStats';
  platform: DevicePlatform;
  deviceCount: Scalars['Int']['output'];
  notificationsSent: Scalars['Int']['output'];
  deliveryRate: Scalars['Float']['output'];
}

export interface Query {
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
  notification?: Maybe<Notification>;
  notifications: Array<Notification>;
  platformStats: Array<PlatformStats>;
  template?: Maybe<Template>;
  templates: Array<Template>;
  workflow?: Maybe<Workflow>;
  workflowExecutions: Array<WorkflowExecution>;
  workflows: Array<Workflow>;
}


export interface QueryAnalyticsDataArgs {
  appId?: InputMaybe<Scalars['ID']['input']>;
  days?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryAppArgs {
  id: Scalars['ID']['input'];
}


export interface QueryAppBySlugArgs {
  slug: Scalars['String']['input'];
}


export interface QueryAppExistsArgs {
  slug: Scalars['String']['input'];
}


export interface QueryAppStatsArgs {
  appId: Scalars['ID']['input'];
}


export interface QueryChannelArgs {
  id: Scalars['ID']['input'];
}


export interface QueryChannelsArgs {
  appId: Scalars['ID']['input'];
  type?: InputMaybe<ChannelType>;
}


export interface QueryContactArgs {
  id: Scalars['ID']['input'];
}


export interface QueryContactByExternalIdArgs {
  appId: Scalars['ID']['input'];
  externalId: Scalars['String']['input'];
}


export interface QueryContactsArgs {
  appId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryDeliveryLogsArgs {
  notificationId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryDeviceArgs {
  id: Scalars['ID']['input'];
}


export interface QueryDeviceByTokenArgs {
  token: Scalars['String']['input'];
}


export interface QueryDevicesArgs {
  appId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryGetEngagementMetricsArgs {
  appId: Scalars['ID']['input'];
  timeRange?: InputMaybe<Scalars['String']['input']>;
}


export interface QueryGetNotificationAnalyticsArgs {
  notificationId: Scalars['ID']['input'];
}


export interface QueryHookArgs {
  id: Scalars['ID']['input'];
}


export interface QueryHooksArgs {
  appId: Scalars['ID']['input'];
}


export interface QueryNotificationArgs {
  id: Scalars['ID']['input'];
}


export interface QueryNotificationsArgs {
  appId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryPlatformStatsArgs {
  appId?: InputMaybe<Scalars['ID']['input']>;
}


export interface QueryTemplateArgs {
  id: Scalars['ID']['input'];
}


export interface QueryTemplatesArgs {
  appId: Scalars['ID']['input'];
  channelType?: InputMaybe<ChannelType>;
}


export interface QueryWorkflowArgs {
  id: Scalars['ID']['input'];
}


export interface QueryWorkflowExecutionsArgs {
  workflowId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}


export interface QueryWorkflowsArgs {
  appId: Scalars['ID']['input'];
  status?: InputMaybe<WorkflowStatus>;
}

export interface RegisterDeviceInput {
  appId: Scalars['ID']['input'];
  token: Scalars['String']['input'];
  category?: InputMaybe<DeviceCategory>;
  platform: DevicePlatform;
  userId?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  webPushP256dh?: InputMaybe<Scalars['String']['input']>;
  webPushAuth?: InputMaybe<Scalars['String']['input']>;
}

export interface SendNotificationInput {
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
}

export interface Template {
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
}

export interface TrackEventInput {
  notificationId: Scalars['ID']['input'];
  deviceId: Scalars['ID']['input'];
  platform?: InputMaybe<Scalars['String']['input']>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
  appVersion?: InputMaybe<Scalars['String']['input']>;
  osVersion?: InputMaybe<Scalars['String']['input']>;
}

export interface TrackEventResponse {
  __typename?: 'TrackEventResponse';
  success: Scalars['Boolean']['output'];
  message?: Maybe<Scalars['String']['output']>;
}

export interface TriggerWorkflowInput {
  workflowId: Scalars['ID']['input'];
  subscriberId?: InputMaybe<Scalars['ID']['input']>;
  payload?: InputMaybe<Scalars['JSON']['input']>;
}

export interface UpdateAppInput {
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
}

export interface UpdateChannelInput {
  name?: InputMaybe<Scalars['String']['input']>;
  config?: InputMaybe<Scalars['JSON']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
}

export interface UpdateContactInput {
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
}

export interface UpdateContactPreferenceInput {
  subscriberId: Scalars['ID']['input'];
  category: Scalars['String']['input'];
  channelType: ChannelType;
  enabled: Scalars['Boolean']['input'];
}

export interface UpdateDeviceInput {
  status?: InputMaybe<DeviceStatus>;
  userId?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
}

export interface UpdateHookInput {
  name?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  secret?: InputMaybe<Scalars['String']['input']>;
  events?: InputMaybe<Scalars['JSON']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
}

export interface UpdateTemplateInput {
  channelId?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
  body?: InputMaybe<Scalars['String']['input']>;
  htmlBody?: InputMaybe<Scalars['String']['input']>;
}

export interface UpdateWorkflowInput {
  name?: InputMaybe<Scalars['String']['input']>;
  triggerIdentifier?: InputMaybe<Scalars['String']['input']>;
  triggerType?: InputMaybe<WorkflowTriggerType>;
  status?: InputMaybe<WorkflowStatus>;
  steps?: InputMaybe<Array<WorkflowStepInput>>;
  flowLayout?: InputMaybe<Scalars['JSON']['input']>;
}

export interface UpsertContactDeviceInput {
  subscriberId: Scalars['ID']['input'];
  deviceId: Scalars['ID']['input'];
}

export interface VapidKeys {
  __typename?: 'VapidKeys';
  publicKey: Scalars['String']['output'];
  privateKey: Scalars['String']['output'];
}

export interface Workflow {
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
}

export interface WorkflowExecution {
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
}

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

export interface WorkflowStep {
  __typename?: 'WorkflowStep';
  id: Scalars['ID']['output'];
  workflowId: Scalars['ID']['output'];
  nodeId?: Maybe<Scalars['String']['output']>;
  type: WorkflowStepType;
  order: Scalars['Int']['output'];
  config?: Maybe<Scalars['JSON']['output']>;
  createdAt: Scalars['Timestamp']['output'];
  updatedAt: Scalars['Timestamp']['output'];
}

export interface WorkflowStepInput {
  nodeId?: InputMaybe<Scalars['String']['input']>;
  type: WorkflowStepType;
  order: Scalars['Int']['input'];
  config?: InputMaybe<Scalars['JSON']['input']>;
}

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



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AnalyticsData: ResolverTypeWrapper<ResolverReturnType<AnalyticsData>>;
  Int: ResolverTypeWrapper<ResolverReturnType<Scalars['Int']['output']>>;
  ApiKey: ResolverTypeWrapper<ResolverReturnType<ApiKey>>;
  ID: ResolverTypeWrapper<ResolverReturnType<Scalars['ID']['output']>>;
  Boolean: ResolverTypeWrapper<ResolverReturnType<Scalars['Boolean']['output']>>;
  App: ResolverTypeWrapper<ResolverReturnType<App>>;
  AppStats: ResolverTypeWrapper<ResolverReturnType<AppStats>>;
  Float: ResolverTypeWrapper<ResolverReturnType<Scalars['Float']['output']>>;
  Channel: ResolverTypeWrapper<ResolverReturnType<Channel>>;
  ChannelType: ResolverTypeWrapper<ResolverReturnType<ChannelType>>;
  ConfigureAPNsInput: ResolverTypeWrapper<ResolverReturnType<ConfigureApNsInput>>;
  ConfigureFCMInput: ResolverTypeWrapper<ResolverReturnType<ConfigureFcmInput>>;
  ConfigureWebPushInput: ResolverTypeWrapper<ResolverReturnType<ConfigureWebPushInput>>;
  Contact: ResolverTypeWrapper<ResolverReturnType<Contact>>;
  ContactPreference: ResolverTypeWrapper<ResolverReturnType<ContactPreference>>;
  CreateAppInput: ResolverTypeWrapper<ResolverReturnType<CreateAppInput>>;
  CreateChannelInput: ResolverTypeWrapper<ResolverReturnType<CreateChannelInput>>;
  CreateContactInput: ResolverTypeWrapper<ResolverReturnType<CreateContactInput>>;
  CreateHookInput: ResolverTypeWrapper<ResolverReturnType<CreateHookInput>>;
  CreateTemplateInput: ResolverTypeWrapper<ResolverReturnType<CreateTemplateInput>>;
  CreateWorkflowInput: ResolverTypeWrapper<ResolverReturnType<CreateWorkflowInput>>;
  DashboardStats: ResolverTypeWrapper<ResolverReturnType<DashboardStats>>;
  DeliveryLog: ResolverTypeWrapper<ResolverReturnType<DeliveryLog>>;
  DeliveryStatus: ResolverTypeWrapper<ResolverReturnType<DeliveryStatus>>;
  Device: ResolverTypeWrapper<ResolverReturnType<Device>>;
  DeviceCategory: ResolverTypeWrapper<ResolverReturnType<DeviceCategory>>;
  DevicePlatform: ResolverTypeWrapper<ResolverReturnType<DevicePlatform>>;
  DeviceStatus: ResolverTypeWrapper<ResolverReturnType<DeviceStatus>>;
  EngagementMetrics: ResolverTypeWrapper<ResolverReturnType<EngagementMetrics>>;
  Hook: ResolverTypeWrapper<ResolverReturnType<Hook>>;
  HookEvent: ResolverTypeWrapper<ResolverReturnType<HookEvent>>;
  JSON: ResolverTypeWrapper<ResolverReturnType<Scalars['JSON']['output']>>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Notification: ResolverTypeWrapper<ResolverReturnType<Notification>>;
  NotificationAnalytics: ResolverTypeWrapper<ResolverReturnType<NotificationAnalytics>>;
  NotificationStatus: ResolverTypeWrapper<ResolverReturnType<NotificationStatus>>;
  PageInfo: ResolverTypeWrapper<ResolverReturnType<PageInfo>>;
  PlatformMetrics: ResolverTypeWrapper<ResolverReturnType<PlatformMetrics>>;
  PlatformStats: ResolverTypeWrapper<ResolverReturnType<PlatformStats>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RegisterDeviceInput: ResolverTypeWrapper<ResolverReturnType<RegisterDeviceInput>>;
  SendNotificationInput: ResolverTypeWrapper<ResolverReturnType<SendNotificationInput>>;
  Template: ResolverTypeWrapper<ResolverReturnType<Template>>;
  Timestamp: ResolverTypeWrapper<ResolverReturnType<Scalars['Timestamp']['output']>>;
  TrackEventInput: ResolverTypeWrapper<ResolverReturnType<TrackEventInput>>;
  TrackEventResponse: ResolverTypeWrapper<ResolverReturnType<TrackEventResponse>>;
  TriggerWorkflowInput: ResolverTypeWrapper<ResolverReturnType<TriggerWorkflowInput>>;
  UpdateAppInput: ResolverTypeWrapper<ResolverReturnType<UpdateAppInput>>;
  UpdateChannelInput: ResolverTypeWrapper<ResolverReturnType<UpdateChannelInput>>;
  UpdateContactInput: ResolverTypeWrapper<ResolverReturnType<UpdateContactInput>>;
  UpdateContactPreferenceInput: ResolverTypeWrapper<ResolverReturnType<UpdateContactPreferenceInput>>;
  UpdateDeviceInput: ResolverTypeWrapper<ResolverReturnType<UpdateDeviceInput>>;
  UpdateHookInput: ResolverTypeWrapper<ResolverReturnType<UpdateHookInput>>;
  UpdateTemplateInput: ResolverTypeWrapper<ResolverReturnType<UpdateTemplateInput>>;
  UpdateWorkflowInput: ResolverTypeWrapper<ResolverReturnType<UpdateWorkflowInput>>;
  UpsertContactDeviceInput: ResolverTypeWrapper<ResolverReturnType<UpsertContactDeviceInput>>;
  VapidKeys: ResolverTypeWrapper<ResolverReturnType<VapidKeys>>;
  Workflow: ResolverTypeWrapper<ResolverReturnType<Workflow>>;
  WorkflowExecution: ResolverTypeWrapper<ResolverReturnType<WorkflowExecution>>;
  WorkflowExecutionStatus: ResolverTypeWrapper<ResolverReturnType<WorkflowExecutionStatus>>;
  WorkflowStatus: ResolverTypeWrapper<ResolverReturnType<WorkflowStatus>>;
  WorkflowStep: ResolverTypeWrapper<ResolverReturnType<WorkflowStep>>;
  WorkflowStepInput: ResolverTypeWrapper<ResolverReturnType<WorkflowStepInput>>;
  WorkflowStepType: ResolverTypeWrapper<ResolverReturnType<WorkflowStepType>>;
  WorkflowTriggerType: ResolverTypeWrapper<ResolverReturnType<WorkflowTriggerType>>;
  String: ResolverTypeWrapper<ResolverReturnType<Scalars['String']['output']>>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AnalyticsData: ResolverReturnType<AnalyticsData>;
  Int: ResolverReturnType<Scalars['Int']['output']>;
  ApiKey: ResolverReturnType<ApiKey>;
  ID: ResolverReturnType<Scalars['ID']['output']>;
  Boolean: ResolverReturnType<Scalars['Boolean']['output']>;
  App: ResolverReturnType<App>;
  AppStats: ResolverReturnType<AppStats>;
  Float: ResolverReturnType<Scalars['Float']['output']>;
  Channel: ResolverReturnType<Channel>;
  ConfigureAPNsInput: ResolverReturnType<ConfigureApNsInput>;
  ConfigureFCMInput: ResolverReturnType<ConfigureFcmInput>;
  ConfigureWebPushInput: ResolverReturnType<ConfigureWebPushInput>;
  Contact: ResolverReturnType<Contact>;
  ContactPreference: ResolverReturnType<ContactPreference>;
  CreateAppInput: ResolverReturnType<CreateAppInput>;
  CreateChannelInput: ResolverReturnType<CreateChannelInput>;
  CreateContactInput: ResolverReturnType<CreateContactInput>;
  CreateHookInput: ResolverReturnType<CreateHookInput>;
  CreateTemplateInput: ResolverReturnType<CreateTemplateInput>;
  CreateWorkflowInput: ResolverReturnType<CreateWorkflowInput>;
  DashboardStats: ResolverReturnType<DashboardStats>;
  DeliveryLog: ResolverReturnType<DeliveryLog>;
  Device: ResolverReturnType<Device>;
  EngagementMetrics: ResolverReturnType<EngagementMetrics>;
  Hook: ResolverReturnType<Hook>;
  JSON: ResolverReturnType<Scalars['JSON']['output']>;
  Mutation: Record<PropertyKey, never>;
  Notification: ResolverReturnType<Notification>;
  NotificationAnalytics: ResolverReturnType<NotificationAnalytics>;
  PageInfo: ResolverReturnType<PageInfo>;
  PlatformMetrics: ResolverReturnType<PlatformMetrics>;
  PlatformStats: ResolverReturnType<PlatformStats>;
  Query: Record<PropertyKey, never>;
  RegisterDeviceInput: ResolverReturnType<RegisterDeviceInput>;
  SendNotificationInput: ResolverReturnType<SendNotificationInput>;
  Template: ResolverReturnType<Template>;
  Timestamp: ResolverReturnType<Scalars['Timestamp']['output']>;
  TrackEventInput: ResolverReturnType<TrackEventInput>;
  TrackEventResponse: ResolverReturnType<TrackEventResponse>;
  TriggerWorkflowInput: ResolverReturnType<TriggerWorkflowInput>;
  UpdateAppInput: ResolverReturnType<UpdateAppInput>;
  UpdateChannelInput: ResolverReturnType<UpdateChannelInput>;
  UpdateContactInput: ResolverReturnType<UpdateContactInput>;
  UpdateContactPreferenceInput: ResolverReturnType<UpdateContactPreferenceInput>;
  UpdateDeviceInput: ResolverReturnType<UpdateDeviceInput>;
  UpdateHookInput: ResolverReturnType<UpdateHookInput>;
  UpdateTemplateInput: ResolverReturnType<UpdateTemplateInput>;
  UpdateWorkflowInput: ResolverReturnType<UpdateWorkflowInput>;
  UpsertContactDeviceInput: ResolverReturnType<UpsertContactDeviceInput>;
  VapidKeys: ResolverReturnType<VapidKeys>;
  Workflow: ResolverReturnType<Workflow>;
  WorkflowExecution: ResolverReturnType<WorkflowExecution>;
  WorkflowStep: ResolverReturnType<WorkflowStep>;
  WorkflowStepInput: ResolverReturnType<WorkflowStepInput>;
  String: ResolverReturnType<Scalars['String']['output']>;
};

export type AuthDirectiveArgs = { };

export type AuthDirectiveResolver<Result, Parent, ContextType = H3Event, Args = AuthDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type HasRoleDirectiveArgs = {
  role: Scalars['String']['input'];
};

export type HasRoleDirectiveResolver<Result, Parent, ContextType = H3Event, Args = HasRoleDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AnalyticsDataResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['AnalyticsData'] = ResolversParentTypes['AnalyticsData']> = {
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  delivered?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  failed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  clicked?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ApiKeyResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  appId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  app?: Resolver<Maybe<ResolversTypes['App']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  permissions?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  isActive?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  lastUsedAt?: Resolver<Maybe<ResolversTypes['Timestamp']>, ParentType, ContextType>;
  expiresAt?: Resolver<Maybe<ResolversTypes['Timestamp']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
};

export type AppResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['App'] = ResolversParentTypes['App']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  apiKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fcmProjectId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fcmServiceAccount?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  apnsKeyId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  apnsTeamId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  apnsPrivateKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bundleId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vapidSubject?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vapidPublicKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vapidPrivateKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  devices?: Resolver<Maybe<Array<ResolversTypes['Device']>>, ParentType, ContextType>;
  notifications?: Resolver<Maybe<Array<ResolversTypes['Notification']>>, ParentType, ContextType>;
  apiKeys?: Resolver<Maybe<Array<ResolversTypes['ApiKey']>>, ParentType, ContextType>;
  stats?: Resolver<Maybe<ResolversTypes['AppStats']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
};

export type AppStatsResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['AppStats'] = ResolversParentTypes['AppStats']> = {
  totalDevices?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  activeDevices?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  newDevicesToday?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sentToday?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  deliveryRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  apiCalls?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ChannelResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['Channel'] = ResolversParentTypes['Channel']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  appId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ChannelType'], ParentType, ContextType>;
  config?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
};

export type ContactResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['Contact'] = ResolversParentTypes['Contact']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  appId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  externalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  locale?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadata?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  devices?: Resolver<Maybe<Array<ResolversTypes['Device']>>, ParentType, ContextType>;
  preferences?: Resolver<Maybe<Array<ResolversTypes['ContactPreference']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
};

export type ContactPreferenceResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['ContactPreference'] = ResolversParentTypes['ContactPreference']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  subscriberId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  category?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  channelType?: Resolver<ResolversTypes['ChannelType'], ParentType, ContextType>;
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
};

export type DashboardStatsResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['DashboardStats'] = ResolversParentTypes['DashboardStats']> = {
  totalApps?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  activeDevices?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  notificationsSent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  deliveryRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type DeliveryLogResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['DeliveryLog'] = ResolversParentTypes['DeliveryLog']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  notificationId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  notification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType>;
  deviceId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  device?: Resolver<Maybe<ResolversTypes['Device']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['DeliveryStatus'], ParentType, ContextType>;
  errorMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  clickedAt?: Resolver<Maybe<ResolversTypes['Timestamp']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
};

export type DeviceResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['Device'] = ResolversParentTypes['Device']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  appId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  app?: Resolver<Maybe<ResolversTypes['App']>, ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  category?: Resolver<Maybe<ResolversTypes['DeviceCategory']>, ParentType, ContextType>;
  platform?: Resolver<ResolversTypes['DevicePlatform'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['DeviceStatus'], ParentType, ContextType>;
  userId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadata?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  webPushP256dh?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  webPushAuth?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  deliveryLogs?: Resolver<Maybe<Array<ResolversTypes['DeliveryLog']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  lastSeenAt?: Resolver<Maybe<ResolversTypes['Timestamp']>, ParentType, ContextType>;
};

export type EngagementMetricsResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['EngagementMetrics'] = ResolversParentTypes['EngagementMetrics']> = {
  totalNotifications?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalSent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalDelivered?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalOpened?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalClicked?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  overallDeliveryRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  overallOpenRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  overallClickRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  platformBreakdown?: Resolver<Array<ResolversTypes['PlatformMetrics']>, ParentType, ContextType>;
};

export type HookResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['Hook'] = ResolversParentTypes['Hook']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  appId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  secret?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  events?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type MutationResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  cancelNotification?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCancelNotificationArgs, 'id'>>;
  configureAPNs?: Resolver<ResolversTypes['App'], ParentType, ContextType, RequireFields<MutationConfigureApNsArgs, 'id' | 'input'>>;
  configureFCM?: Resolver<ResolversTypes['App'], ParentType, ContextType, RequireFields<MutationConfigureFcmArgs, 'id' | 'input'>>;
  configureWebPush?: Resolver<ResolversTypes['App'], ParentType, ContextType, RequireFields<MutationConfigureWebPushArgs, 'id' | 'input'>>;
  createApp?: Resolver<ResolversTypes['App'], ParentType, ContextType, RequireFields<MutationCreateAppArgs, 'input'>>;
  createChannel?: Resolver<ResolversTypes['Channel'], ParentType, ContextType, RequireFields<MutationCreateChannelArgs, 'input'>>;
  createContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationCreateContactArgs, 'input'>>;
  createHook?: Resolver<ResolversTypes['Hook'], ParentType, ContextType, RequireFields<MutationCreateHookArgs, 'input'>>;
  createTemplate?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<MutationCreateTemplateArgs, 'input'>>;
  createWorkflow?: Resolver<ResolversTypes['Workflow'], ParentType, ContextType, RequireFields<MutationCreateWorkflowArgs, 'input'>>;
  deleteApp?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteAppArgs, 'id'>>;
  deleteChannel?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteChannelArgs, 'id'>>;
  deleteContact?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteContactArgs, 'id'>>;
  deleteDevice?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteDeviceArgs, 'id'>>;
  deleteHook?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteHookArgs, 'id'>>;
  deleteTemplate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteTemplateArgs, 'id'>>;
  deleteWorkflow?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteWorkflowArgs, 'id'>>;
  regenerateApiKey?: Resolver<ResolversTypes['App'], ParentType, ContextType, RequireFields<MutationRegenerateApiKeyArgs, 'id'>>;
  registerDevice?: Resolver<ResolversTypes['Device'], ParentType, ContextType, RequireFields<MutationRegisterDeviceArgs, 'input'>>;
  scheduleNotification?: Resolver<ResolversTypes['Notification'], ParentType, ContextType, RequireFields<MutationScheduleNotificationArgs, 'input'>>;
  sendNotification?: Resolver<ResolversTypes['Notification'], ParentType, ContextType, RequireFields<MutationSendNotificationArgs, 'input'>>;
  trackNotificationClicked?: Resolver<ResolversTypes['TrackEventResponse'], ParentType, ContextType, RequireFields<MutationTrackNotificationClickedArgs, 'input'>>;
  trackNotificationDelivered?: Resolver<ResolversTypes['TrackEventResponse'], ParentType, ContextType, RequireFields<MutationTrackNotificationDeliveredArgs, 'input'>>;
  trackNotificationOpened?: Resolver<ResolversTypes['TrackEventResponse'], ParentType, ContextType, RequireFields<MutationTrackNotificationOpenedArgs, 'input'>>;
  triggerWorkflow?: Resolver<ResolversTypes['WorkflowExecution'], ParentType, ContextType, RequireFields<MutationTriggerWorkflowArgs, 'input'>>;
  updateApp?: Resolver<ResolversTypes['App'], ParentType, ContextType, RequireFields<MutationUpdateAppArgs, 'id' | 'input'>>;
  updateChannel?: Resolver<ResolversTypes['Channel'], ParentType, ContextType, RequireFields<MutationUpdateChannelArgs, 'id' | 'input'>>;
  updateContact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType, RequireFields<MutationUpdateContactArgs, 'id' | 'input'>>;
  updateContactPreference?: Resolver<ResolversTypes['ContactPreference'], ParentType, ContextType, RequireFields<MutationUpdateContactPreferenceArgs, 'input'>>;
  updateDevice?: Resolver<ResolversTypes['Device'], ParentType, ContextType, RequireFields<MutationUpdateDeviceArgs, 'id' | 'input'>>;
  updateHook?: Resolver<ResolversTypes['Hook'], ParentType, ContextType, RequireFields<MutationUpdateHookArgs, 'id' | 'input'>>;
  updateTemplate?: Resolver<ResolversTypes['Template'], ParentType, ContextType, RequireFields<MutationUpdateTemplateArgs, 'id' | 'input'>>;
  updateWorkflow?: Resolver<ResolversTypes['Workflow'], ParentType, ContextType, RequireFields<MutationUpdateWorkflowArgs, 'id' | 'input'>>;
  upsertContactDevice?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUpsertContactDeviceArgs, 'input'>>;
};

export type NotificationResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['Notification'] = ResolversParentTypes['Notification']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  appId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  app?: Resolver<Maybe<ResolversTypes['App']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  data?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  clickAction?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sound?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  badge?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['NotificationStatus'], ParentType, ContextType>;
  targetDevices?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  platforms?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  scheduledAt?: Resolver<Maybe<ResolversTypes['Timestamp']>, ParentType, ContextType>;
  totalTargets?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalSent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalDelivered?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalFailed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalClicked?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  deliveryLogs?: Resolver<Maybe<Array<ResolversTypes['DeliveryLog']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  sentAt?: Resolver<Maybe<ResolversTypes['Timestamp']>, ParentType, ContextType>;
};

export type NotificationAnalyticsResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['NotificationAnalytics'] = ResolversParentTypes['NotificationAnalytics']> = {
  notificationId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  sentCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  deliveredCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  openedCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  clickedCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  deliveryRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  openRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  clickRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  platformBreakdown?: Resolver<Array<ResolversTypes['PlatformMetrics']>, ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type PlatformMetricsResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['PlatformMetrics'] = ResolversParentTypes['PlatformMetrics']> = {
  platform?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  delivered?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  opened?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  clicked?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  avgDeliveryTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  avgOpenTime?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
};

export type PlatformStatsResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['PlatformStats'] = ResolversParentTypes['PlatformStats']> = {
  platform?: Resolver<ResolversTypes['DevicePlatform'], ParentType, ContextType>;
  deviceCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  notificationsSent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  deliveryRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  analyticsData?: Resolver<Array<ResolversTypes['AnalyticsData']>, ParentType, ContextType, RequireFields<QueryAnalyticsDataArgs, 'days'>>;
  app?: Resolver<Maybe<ResolversTypes['App']>, ParentType, ContextType, RequireFields<QueryAppArgs, 'id'>>;
  appBySlug?: Resolver<Maybe<ResolversTypes['App']>, ParentType, ContextType, RequireFields<QueryAppBySlugArgs, 'slug'>>;
  appExists?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<QueryAppExistsArgs, 'slug'>>;
  appStats?: Resolver<Maybe<ResolversTypes['AppStats']>, ParentType, ContextType, RequireFields<QueryAppStatsArgs, 'appId'>>;
  apps?: Resolver<Array<ResolversTypes['App']>, ParentType, ContextType>;
  channel?: Resolver<Maybe<ResolversTypes['Channel']>, ParentType, ContextType, RequireFields<QueryChannelArgs, 'id'>>;
  channels?: Resolver<Array<ResolversTypes['Channel']>, ParentType, ContextType, RequireFields<QueryChannelsArgs, 'appId'>>;
  contact?: Resolver<Maybe<ResolversTypes['Contact']>, ParentType, ContextType, RequireFields<QueryContactArgs, 'id'>>;
  contactByExternalId?: Resolver<Maybe<ResolversTypes['Contact']>, ParentType, ContextType, RequireFields<QueryContactByExternalIdArgs, 'appId' | 'externalId'>>;
  contacts?: Resolver<Array<ResolversTypes['Contact']>, ParentType, ContextType, RequireFields<QueryContactsArgs, 'appId' | 'limit' | 'offset'>>;
  dashboardStats?: Resolver<ResolversTypes['DashboardStats'], ParentType, ContextType>;
  deliveryLogs?: Resolver<Array<ResolversTypes['DeliveryLog']>, ParentType, ContextType, RequireFields<QueryDeliveryLogsArgs, 'limit' | 'offset'>>;
  device?: Resolver<Maybe<ResolversTypes['Device']>, ParentType, ContextType, RequireFields<QueryDeviceArgs, 'id'>>;
  deviceByToken?: Resolver<Maybe<ResolversTypes['Device']>, ParentType, ContextType, RequireFields<QueryDeviceByTokenArgs, 'token'>>;
  devices?: Resolver<Array<ResolversTypes['Device']>, ParentType, ContextType, RequireFields<QueryDevicesArgs, 'limit' | 'offset'>>;
  generateVapidKeys?: Resolver<ResolversTypes['VapidKeys'], ParentType, ContextType>;
  getEngagementMetrics?: Resolver<Maybe<ResolversTypes['EngagementMetrics']>, ParentType, ContextType, RequireFields<QueryGetEngagementMetricsArgs, 'appId'>>;
  getNotificationAnalytics?: Resolver<Maybe<ResolversTypes['NotificationAnalytics']>, ParentType, ContextType, RequireFields<QueryGetNotificationAnalyticsArgs, 'notificationId'>>;
  hook?: Resolver<Maybe<ResolversTypes['Hook']>, ParentType, ContextType, RequireFields<QueryHookArgs, 'id'>>;
  hooks?: Resolver<Array<ResolversTypes['Hook']>, ParentType, ContextType, RequireFields<QueryHooksArgs, 'appId'>>;
  notification?: Resolver<Maybe<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<QueryNotificationArgs, 'id'>>;
  notifications?: Resolver<Array<ResolversTypes['Notification']>, ParentType, ContextType, RequireFields<QueryNotificationsArgs, 'limit' | 'offset'>>;
  platformStats?: Resolver<Array<ResolversTypes['PlatformStats']>, ParentType, ContextType, Partial<QueryPlatformStatsArgs>>;
  template?: Resolver<Maybe<ResolversTypes['Template']>, ParentType, ContextType, RequireFields<QueryTemplateArgs, 'id'>>;
  templates?: Resolver<Array<ResolversTypes['Template']>, ParentType, ContextType, RequireFields<QueryTemplatesArgs, 'appId'>>;
  workflow?: Resolver<Maybe<ResolversTypes['Workflow']>, ParentType, ContextType, RequireFields<QueryWorkflowArgs, 'id'>>;
  workflowExecutions?: Resolver<Array<ResolversTypes['WorkflowExecution']>, ParentType, ContextType, RequireFields<QueryWorkflowExecutionsArgs, 'workflowId' | 'limit' | 'offset'>>;
  workflows?: Resolver<Array<ResolversTypes['Workflow']>, ParentType, ContextType, RequireFields<QueryWorkflowsArgs, 'appId'>>;
};

export type TemplateResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['Template'] = ResolversParentTypes['Template']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  appId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  channelId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  channelType?: Resolver<ResolversTypes['ChannelType'], ParentType, ContextType>;
  subject?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  htmlBody?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
};

export interface TimestampScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Timestamp'], any> {
  name: 'Timestamp';
}

export type TrackEventResponseResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['TrackEventResponse'] = ResolversParentTypes['TrackEventResponse']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type VapidKeysResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['VapidKeys'] = ResolversParentTypes['VapidKeys']> = {
  publicKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  privateKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type WorkflowResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['Workflow'] = ResolversParentTypes['Workflow']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  appId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  triggerIdentifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  triggerType?: Resolver<ResolversTypes['WorkflowTriggerType'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['WorkflowStatus'], ParentType, ContextType>;
  flowLayout?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  steps?: Resolver<Maybe<Array<ResolversTypes['WorkflowStep']>>, ParentType, ContextType>;
};

export type WorkflowExecutionResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['WorkflowExecution'] = ResolversParentTypes['WorkflowExecution']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  workflowId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  subscriberId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  triggerIdentifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  payload?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['WorkflowExecutionStatus'], ParentType, ContextType>;
  currentStepOrder?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  errorMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  completedAt?: Resolver<Maybe<ResolversTypes['Timestamp']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
};

export type WorkflowStepResolvers<ContextType = H3Event, ParentType extends ResolversParentTypes['WorkflowStep'] = ResolversParentTypes['WorkflowStep']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  workflowId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nodeId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['WorkflowStepType'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  config?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Timestamp'], ParentType, ContextType>;
};

export type Resolvers<ContextType = H3Event> = {
  AnalyticsData?: AnalyticsDataResolvers<ContextType>;
  ApiKey?: ApiKeyResolvers<ContextType>;
  App?: AppResolvers<ContextType>;
  AppStats?: AppStatsResolvers<ContextType>;
  Channel?: ChannelResolvers<ContextType>;
  Contact?: ContactResolvers<ContextType>;
  ContactPreference?: ContactPreferenceResolvers<ContextType>;
  DashboardStats?: DashboardStatsResolvers<ContextType>;
  DeliveryLog?: DeliveryLogResolvers<ContextType>;
  Device?: DeviceResolvers<ContextType>;
  EngagementMetrics?: EngagementMetricsResolvers<ContextType>;
  Hook?: HookResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  NotificationAnalytics?: NotificationAnalyticsResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  PlatformMetrics?: PlatformMetricsResolvers<ContextType>;
  PlatformStats?: PlatformStatsResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Template?: TemplateResolvers<ContextType>;
  Timestamp?: GraphQLScalarType;
  TrackEventResponse?: TrackEventResponseResolvers<ContextType>;
  VapidKeys?: VapidKeysResolvers<ContextType>;
  Workflow?: WorkflowResolvers<ContextType>;
  WorkflowExecution?: WorkflowExecutionResolvers<ContextType>;
  WorkflowStep?: WorkflowStepResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = H3Event> = {
  auth?: AuthDirectiveResolver<any, any, ContextType>;
  hasRole?: HasRoleDirectiveResolver<any, any, ContextType>;
};
