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
	`purchase_price` real,
	`acquired_date` text NOT NULL,
	`status` text DEFAULT 'vaulted' NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

INSERT INTO `inventory_items_new`
	SELECT id, card_id, storage_type, condition, grading_company, grade,
	       cert_number, is_misprint, notes, purchase_price, acquired_date, status
	FROM `inventory_items`;
--> statement-breakpoint

DROP TABLE `inventory_items`;
--> statement-breakpoint

ALTER TABLE `inventory_items_new` RENAME TO `inventory_items`;
--> statement-breakpoint

ALTER TABLE `cards` ADD COLUMN `artist` text;
--> statement-breakpoint

ALTER TABLE `sales_ledger` RENAME COLUMN `listed_price` TO `listed_price_gbp`;
--> statement-breakpoint

ALTER TABLE `sales_ledger` RENAME COLUMN `final_sale_price` TO `final_sale_price_gbp`;
--> statement-breakpoint

ALTER TABLE `sales_ledger` RENAME COLUMN `platform_fees` TO `platform_fees_gbp`;
--> statement-breakpoint

ALTER TABLE `sales_ledger` RENAME COLUMN `shipping_cost` TO `shipping_cost_gbp`;
--> statement-breakpoint

CREATE TABLE `valuation_history` (
	`id` text PRIMARY KEY NOT NULL,
	`inventory_item_id` text NOT NULL,
	`checked_value_gbp` real NOT NULL,
	`check_date` text NOT NULL,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

PRAGMA foreign_keys=ON;
