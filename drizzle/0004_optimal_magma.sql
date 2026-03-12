ALTER TABLE `categories` DROP FOREIGN KEY `categories_companyId_companies_id_fk`;
--> statement-breakpoint
ALTER TABLE `company_members` DROP FOREIGN KEY `company_members_companyId_companies_id_fk`;
--> statement-breakpoint
ALTER TABLE `company_members` DROP FOREIGN KEY `company_members_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `menu_items` DROP FOREIGN KEY `menu_items_companyId_companies_id_fk`;
--> statement-breakpoint
ALTER TABLE `menu_items` DROP FOREIGN KEY `menu_items_categoryId_categories_id_fk`;
--> statement-breakpoint
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_companyId_companies_id_fk`;
--> statement-breakpoint
ALTER TABLE `companies` ADD `carouselImages` text;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `isVegetarian` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `containsGluten` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `containsLactose` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `isSpicy` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `menu_items` ADD `chefRecommended` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_members` ADD CONSTRAINT `company_members_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_members` ADD CONSTRAINT `company_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;