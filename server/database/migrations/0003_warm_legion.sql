CREATE TYPE "public"."delivery_status" AS ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CLICKED');--> statement-breakpoint
ALTER TABLE "apiKey" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "apiKey" ALTER COLUMN "lastUsedAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "apiKey" ALTER COLUMN "expiresAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "apiKey" ALTER COLUMN "createdAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "apiKey" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "apiKey" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "apiKey" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "apiKey" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "apiKey" ALTER COLUMN "updatedAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "isActive" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "createdAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "app" ALTER COLUMN "updatedAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deliveryLog" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "deliveryLog" ALTER COLUMN "status" SET DATA TYPE "public"."delivery_status" USING "status"::text::"public"."delivery_status";--> statement-breakpoint
ALTER TABLE "deliveryLog" ALTER COLUMN "sentAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "deliveryLog" ALTER COLUMN "deliveredAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "deliveryLog" ALTER COLUMN "openedAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "deliveryLog" ALTER COLUMN "clickedAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "deliveryLog" ALTER COLUMN "createdAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "deliveryLog" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "deliveryLog" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "lastSeenAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "createdAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "updatedAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "scheduledAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "expiresAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "totalTargets" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "totalSent" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "totalDelivered" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "totalFailed" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "totalClicked" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "createdAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp(3) with time zone;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "updatedAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deliveryLog" ADD COLUMN "updatedAt" timestamp(3) with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "imageUrl" text;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "sentAt" timestamp(3) with time zone;