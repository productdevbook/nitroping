ALTER TABLE "deliveryLog" ADD COLUMN "openedAt" timestamp;--> statement-breakpoint
ALTER TABLE "deliveryLog" ADD COLUMN "clickedAt" timestamp;--> statement-breakpoint
ALTER TABLE "deliveryLog" ADD COLUMN "platform" text;--> statement-breakpoint
ALTER TABLE "deliveryLog" ADD COLUMN "userAgent" text;--> statement-breakpoint
ALTER TABLE "deliveryLog" ADD COLUMN "appVersion" text;--> statement-breakpoint
ALTER TABLE "deliveryLog" ADD COLUMN "osVersion" text;