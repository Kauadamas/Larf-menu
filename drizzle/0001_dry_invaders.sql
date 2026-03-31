CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`namePt` varchar(255) NOT NULL,
	`nameEs` varchar(255),
	`nameEn` varchar(255),
	`sortOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`logoUrl` text,
	`address` text,
	`phone` varchar(50),
	`customDomain` varchar(255),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `company_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','manager') NOT NULL DEFAULT 'manager',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`categoryId` int NOT NULL,
	`namePt` varchar(255) NOT NULL,
	`nameEs` varchar(255),
	`nameEn` varchar(255),
	`descriptionPt` text,
	`descriptionEs` text,
	`descriptionEn` text,
	`priceBrl` decimal(10,2) NOT NULL,
	`imageUrl` text,
	`imageKey` text,
	`available` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','superadmin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_members` ADD CONSTRAINT `company_members_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_members` ADD CONSTRAINT `company_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;