CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`sdk_id` text NOT NULL,
	`name` text NOT NULL,
	`supertype` text NOT NULL,
	`subtypes` text,
	`rarity` text NOT NULL,
	`set_number` text NOT NULL,
	`set_name` text NOT NULL,
	`language` text NOT NULL,
	`image_url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`storage_type` text NOT NULL,
	`condition` text,
	`grading_company` text,
	`grade` real,
	`cert_number` text,
	`is_misprint` integer DEFAULT false,
	`notes` text,
	`purchase_price` real NOT NULL,
	`acquired_date` text NOT NULL,
	`estimated_value` real,
	`last_value_check` text,
	`status` text DEFAULT 'vaulted' NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`inventory_item_id` text NOT NULL,
	`platform` text DEFAULT 'ebay' NOT NULL,
	`listing_url` text,
	`listed_price` real,
	`date_listed` text,
	`date_sold` text,
	`final_sale_price` real,
	`platform_fees` real,
	`shipping_cost` real,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action
);
