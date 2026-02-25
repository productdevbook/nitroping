ALTER TYPE "channelType" ADD VALUE 'DISCORD';--> statement-breakpoint
CREATE TABLE "inAppMessage" (
	"id" uuid PRIMARY KEY,
	"appId" uuid NOT NULL,
	"contactId" uuid NOT NULL,
	"notificationId" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"isRead" boolean DEFAULT false NOT NULL,
	"readAt" timestamp(3) with time zone,
	"createdAt" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact" ADD COLUMN "name" text;--> statement-breakpoint
CREATE INDEX "in_app_message_contact_id_idx" ON "inAppMessage" ("contactId");--> statement-breakpoint
CREATE INDEX "in_app_message_app_id_idx" ON "inAppMessage" ("appId");--> statement-breakpoint
CREATE INDEX "in_app_message_is_read_idx" ON "inAppMessage" ("contactId","isRead");--> statement-breakpoint
ALTER TABLE "inAppMessage" ADD CONSTRAINT "inAppMessage_appId_app_id_fkey" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inAppMessage" ADD CONSTRAINT "inAppMessage_contactId_contact_id_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "inAppMessage" ADD CONSTRAINT "inAppMessage_notificationId_notification_id_fkey" FOREIGN KEY ("notificationId") REFERENCES "notification"("id") ON DELETE SET NULL;