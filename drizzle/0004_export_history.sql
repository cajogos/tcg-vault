CREATE TABLE `export_history` (
  `id` text PRIMARY KEY NOT NULL,
  `exported_at` text NOT NULL,
  `file_name` text NOT NULL,
  `item_count` integer NOT NULL,
  `total_value_gbp` real,
  `discount_percent` real,
  `final_value_gbp` real,
  `included_tag_ids` text NOT NULL DEFAULT '[]'
);
