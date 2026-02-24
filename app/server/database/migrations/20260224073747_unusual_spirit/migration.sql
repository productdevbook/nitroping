CREATE TYPE "channelType" AS ENUM('PUSH', 'EMAIL', 'SMS', 'IN_APP');--> statement-breakpoint
CREATE TYPE "hookEvent" AS ENUM('NOTIFICATION_SENT', 'NOTIFICATION_DELIVERED', 'NOTIFICATION_FAILED', 'NOTIFICATION_CLICKED', 'WORKFLOW_COMPLETED', 'WORKFLOW_FAILED');--> statement-breakpoint
CREATE TYPE "workflowExecutionStatus" AS ENUM('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "workflowStatus" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "workflowStepType" AS ENUM('SEND', 'DELAY', 'FILTER', 'DIGEST', 'BRANCH');--> statement-breakpoint
CREATE TYPE "workflowTriggerType" AS ENUM('EVENT', 'SCHEDULED', 'MANUAL');--> statement-breakpoint
CREATE TABLE "channel" (
	"id" uuid PRIMARY KEY,
	"appId" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "channelType" NOT NULL,
	"config" jsonb,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hook" (
	"id" uuid PRIMARY KEY,
	"appId" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"secret" text,
	"events" jsonb,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriber" (
	"id" uuid PRIMARY KEY,
	"appId" uuid NOT NULL,
	"externalId" text NOT NULL,
	"email" text,
	"phone" text,
	"locale" text,
	"metadata" jsonb,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriberDevice" (
	"id" uuid PRIMARY KEY,
	"subscriberId" uuid NOT NULL,
	"deviceId" uuid NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriberPreference" (
	"id" uuid PRIMARY KEY,
	"subscriberId" uuid NOT NULL,
	"category" text NOT NULL,
	"channelType" "channelType" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template" (
	"id" uuid PRIMARY KEY,
	"appId" uuid NOT NULL,
	"channelId" uuid,
	"name" text NOT NULL,
	"channelType" "channelType" NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"htmlBody" text,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow" (
	"id" uuid PRIMARY KEY,
	"appId" uuid NOT NULL,
	"name" text NOT NULL,
	"triggerIdentifier" text NOT NULL,
	"triggerType" "workflowTriggerType" DEFAULT 'EVENT'::"workflowTriggerType" NOT NULL,
	"status" "workflowStatus" DEFAULT 'DRAFT'::"workflowStatus" NOT NULL,
	"flowLayout" jsonb,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflowExecution" (
	"id" uuid PRIMARY KEY,
	"workflowId" uuid NOT NULL,
	"subscriberId" uuid,
	"triggerIdentifier" text NOT NULL,
	"payload" jsonb,
	"status" "workflowExecutionStatus" DEFAULT 'RUNNING'::"workflowExecutionStatus" NOT NULL,
	"currentStepOrder" integer DEFAULT 0 NOT NULL,
	"errorMessage" text,
	"startedAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp(3) with time zone,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflowStep" (
	"id" uuid PRIMARY KEY,
	"workflowId" uuid NOT NULL,
	"nodeId" text,
	"type" "workflowStepType" NOT NULL,
	"order" integer NOT NULL,
	"config" jsonb,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "subscriberId" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "channel_app_id_idx" ON "channel" ("appId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "channel_app_type_idx" ON "channel" ("appId","type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_log_notification_id_idx" ON "deliveryLog" ("notificationId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_log_created_at_idx" ON "deliveryLog" ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_log_status_idx" ON "deliveryLog" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_log_notification_device_idx" ON "deliveryLog" ("notificationId","deviceId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_app_id_idx" ON "device" ("appId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_app_id_status_idx" ON "device" ("appId","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_token_idx" ON "device" ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hook_app_id_idx" ON "hook" ("appId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_status_scheduled_at_idx" ON "notification" ("status","scheduledAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_app_id_idx" ON "notification" ("appId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_created_at_idx" ON "notification" ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriber_app_id_idx" ON "subscriber" ("appId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriber_external_id_idx" ON "subscriber" ("externalId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriber_app_external_unique_idx" ON "subscriber" ("appId","externalId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriberDevice_subscriber_id_idx" ON "subscriberDevice" ("subscriberId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriberDevice_device_id_idx" ON "subscriberDevice" ("deviceId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriberPreference_subscriber_id_idx" ON "subscriberPreference" ("subscriberId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriberPreference_subscriber_category_channel_idx" ON "subscriberPreference" ("subscriberId","category","channelType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_app_id_idx" ON "template" ("appId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_channel_id_idx" ON "template" ("channelId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_channel_type_idx" ON "template" ("channelType");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_app_id_idx" ON "workflow" ("appId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_trigger_identifier_idx" ON "workflow" ("triggerIdentifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_app_trigger_unique_idx" ON "workflow" ("appId","triggerIdentifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowExecution_workflow_id_idx" ON "workflowExecution" ("workflowId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowExecution_subscriber_id_idx" ON "workflowExecution" ("subscriberId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowExecution_status_idx" ON "workflowExecution" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowStep_workflow_id_idx" ON "workflowStep" ("workflowId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflowStep_workflow_order_idx" ON "workflowStep" ("workflowId","order");--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_appId_app_id_fkey" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hook" ADD CONSTRAINT "hook_appId_app_id_fkey" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriber" ADD CONSTRAINT "subscriber_appId_app_id_fkey" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriberDevice" ADD CONSTRAINT "subscriberDevice_subscriberId_subscriber_id_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscriber"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriberDevice" ADD CONSTRAINT "subscriberDevice_deviceId_device_id_fkey" FOREIGN KEY ("deviceId") REFERENCES "device"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriberPreference" ADD CONSTRAINT "subscriberPreference_subscriberId_subscriber_id_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscriber"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "template" ADD CONSTRAINT "template_appId_app_id_fkey" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "template" ADD CONSTRAINT "template_channelId_channel_id_fkey" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_appId_app_id_fkey" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workflowExecution" ADD CONSTRAINT "workflowExecution_workflowId_workflow_id_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workflowExecution" ADD CONSTRAINT "workflowExecution_subscriberId_subscriber_id_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscriber"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "workflowStep" ADD CONSTRAINT "workflowStep_workflowId_workflow_id_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE;