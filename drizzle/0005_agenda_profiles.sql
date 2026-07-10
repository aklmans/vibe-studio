ALTER TABLE "live_sections" ADD COLUMN "profile" varchar(16) NOT NULL DEFAULT 'workbench';
ALTER TABLE "live_sessions" ADD COLUMN "active_section_lecture" integer NOT NULL DEFAULT 0;
ALTER TABLE "live_sessions" ADD COLUMN "active_section_mobile" integer NOT NULL DEFAULT 0;
