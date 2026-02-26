ALTER TABLE "subscriber" RENAME TO "contact";--> statement-breakpoint
ALTER TABLE "subscriberDevice" RENAME TO "contactDevice";--> statement-breakpoint
ALTER TABLE "subscriberPreference" RENAME TO "contactPreference";--> statement-breakpoint
ALTER INDEX "subscriber_app_id_idx" RENAME TO "contact_app_id_idx";--> statement-breakpoint
ALTER INDEX "subscriber_external_id_idx" RENAME TO "contact_external_id_idx";--> statement-breakpoint
ALTER INDEX "subscriber_app_external_unique_idx" RENAME TO "contact_app_external_unique_idx";--> statement-breakpoint
ALTER INDEX "subscriberDevice_subscriber_id_idx" RENAME TO "contactDevice_subscriber_id_idx";--> statement-breakpoint
ALTER INDEX "subscriberDevice_device_id_idx" RENAME TO "contactDevice_device_id_idx";--> statement-breakpoint
ALTER INDEX "subscriberPreference_subscriber_id_idx" RENAME TO "contactPreference_subscriber_id_idx";--> statement-breakpoint
ALTER INDEX "subscriberPreference_subscriber_category_channel_idx" RENAME TO "contactPreference_subscriber_category_channel_idx";