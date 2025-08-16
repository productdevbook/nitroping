CREATE TYPE "public"."device_status" AS ENUM('ACTIVE', 'INACTIVE', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('IOS', 'ANDROID', 'WEB');--> statement-breakpoint
CREATE TABLE "apiKey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"permissions" jsonb,
	"isActive" boolean DEFAULT true,
	"lastUsedAt" timestamp,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "apiKey_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "app" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"apiKey" text NOT NULL,
	"fcmServerKey" text,
	"fcmProjectId" text,
	"apnsCertificate" text,
	"apnsKeyId" text,
	"apnsTeamId" text,
	"bundleId" text,
	"vapidPublicKey" text,
	"vapidPrivateKey" text,
	"vapidSubject" text,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "app_slug_unique" UNIQUE("slug"),
	CONSTRAINT "app_apiKey_unique" UNIQUE("apiKey")
);
--> statement-breakpoint
CREATE TABLE "deliveryLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notificationId" uuid NOT NULL,
	"deviceId" uuid NOT NULL,
	"status" "notification_status" NOT NULL,
	"providerResponse" jsonb,
	"errorMessage" text,
	"attemptCount" integer DEFAULT 1,
	"sentAt" timestamp,
	"deliveredAt" timestamp,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "device" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" "platform" NOT NULL,
	"userId" text,
	"status" "device_status" DEFAULT 'ACTIVE',
	"metadata" jsonb,
	"lastSeenAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appId" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"badge" integer,
	"sound" text,
	"clickAction" text,
	"icon" text,
	"image" text,
	"targetDevices" jsonb,
	"platforms" jsonb,
	"scheduledAt" timestamp,
	"expiresAt" timestamp,
	"status" "notification_status" DEFAULT 'PENDING',
	"totalTargets" integer DEFAULT 0,
	"totalSent" integer DEFAULT 0,
	"totalDelivered" integer DEFAULT 0,
	"totalFailed" integer DEFAULT 0,
	"totalClicked" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "apiKey" ADD CONSTRAINT "apiKey_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveryLog" ADD CONSTRAINT "deliveryLog_notificationId_notification_id_fk" FOREIGN KEY ("notificationId") REFERENCES "public"."notification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveryLog" ADD CONSTRAINT "deliveryLog_deviceId_device_id_fk" FOREIGN KEY ("deviceId") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;