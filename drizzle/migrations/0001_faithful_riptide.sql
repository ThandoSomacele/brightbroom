CREATE TABLE "application_note" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"content" text NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_note" ADD CONSTRAINT "application_note_application_id_cleaner_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."cleaner_application"("id") ON DELETE cascade ON UPDATE no action;