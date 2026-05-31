PRAGMA foreign_keys=OFF;
--> statement-breakpoint

CREATE TABLE `inventory_items_new` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`storage_type` text NOT NULL,
	`condition` text,
	`grading_company` text,
	`grade` real,
	`cert_number` text,
	`is_misprint` integer DEFAULT false,
	`notes` text,
	`tags` text NOT NULL DEFAULT '[]',
	`storage_location` text,
	`status` text DEFAULT 'vaulted' NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

INSERT INTO `inventory_items_new`
	SELECT id, card_id, storage_type, condition, grading_company, grade,
	       cert_number, is_misprint, notes, '[]', NULL, status
	FROM `inventory_items`;
--> statement-breakpoint

DROP TABLE `inventory_items`;
--> statement-breakpoint

ALTER TABLE `inventory_items_new` RENAME TO `inventory_items`;
--> statement-breakpoint

PRAGMA foreign_keys=ON;
