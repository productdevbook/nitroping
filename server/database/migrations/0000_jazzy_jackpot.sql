DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') THEN
        CREATE TYPE "public"."delivery_status" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CLICKED');
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_status') THEN
        CREATE TYPE "public"."device_status" AS ENUM('ACTIVE', 'INACTIVE', 'EXPIRED');
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SCHEDULED');
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform') THEN
        CREATE TYPE "public"."platform" AS ENUM('IOS', 'ANDROID', 'WEB');
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apiKey" (
	"id" uuid PRIMARY KEY NOT NULL,
	"appId" uuid NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"permissions" jsonb,
	"isActive" boolean DEFAULT true,
	"lastUsedAt" timestamp(3) with time zone,
	"expiresAt" timestamp(3) with time zone,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apiKey_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app" (
	"id" uuid PRIMARY KEY NOT NULL,
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
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_slug_unique" UNIQUE("slug"),
	CONSTRAINT "app_apiKey_unique" UNIQUE("apiKey")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deliveryLog" (
	"id" uuid PRIMARY KEY NOT NULL,
	"notificationId" uuid NOT NULL,
	"deviceId" uuid NOT NULL,
	"status" "delivery_status" NOT NULL,
	"providerResponse" jsonb,
	"errorMessage" text,
	"attemptCount" integer DEFAULT 1,
	"sentAt" timestamp(3) with time zone,
	"deliveredAt" timestamp(3) with time zone,
	"openedAt" timestamp(3) with time zone,
	"clickedAt" timestamp(3) with time zone,
	"platform" text,
	"userAgent" text,
	"appVersion" text,
	"osVersion" text,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deliveryLog_notificationId_deviceId_unique" UNIQUE("notificationId","deviceId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device" (
	"id" uuid PRIMARY KEY NOT NULL,
	"appId" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" "platform" NOT NULL,
	"userId" text,
	"status" "device_status" DEFAULT 'ACTIVE' NOT NULL,
	"metadata" jsonb,
	"lastSeenAt" timestamp(3) with time zone,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_appId_token_userId_unique" UNIQUE("appId","token","userId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"appId" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"badge" integer,
	"sound" text,
	"clickAction" text,
	"icon" text,
	"image" text,
	"imageUrl" text,
	"targetDevices" jsonb,
	"platforms" jsonb,
	"scheduledAt" timestamp(3) with time zone,
	"expiresAt" timestamp(3) with time zone,
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"totalTargets" integer DEFAULT 0 NOT NULL,
	"totalSent" integer DEFAULT 0 NOT NULL,
	"totalDelivered" integer DEFAULT 0 NOT NULL,
	"totalFailed" integer DEFAULT 0 NOT NULL,
	"totalClicked" integer DEFAULT 0 NOT NULL,
	"sentAt" timestamp(3) with time zone,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'apiKey_appId_app_id_fk') THEN
        ALTER TABLE "apiKey" ADD CONSTRAINT "apiKey_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'deliveryLog_notificationId_notification_id_fk') THEN
        ALTER TABLE "deliveryLog" ADD CONSTRAINT "deliveryLog_notificationId_notification_id_fk" FOREIGN KEY ("notificationId") REFERENCES "public"."notification"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'deliveryLog_deviceId_device_id_fk') THEN
        ALTER TABLE "deliveryLog" ADD CONSTRAINT "deliveryLog_deviceId_device_id_fk" FOREIGN KEY ("deviceId") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'device_appId_app_id_fk') THEN
        ALTER TABLE "device" ADD CONSTRAINT "device_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notification_appId_app_id_fk') THEN
        ALTER TABLE "notification" ADD CONSTRAINT "notification_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;