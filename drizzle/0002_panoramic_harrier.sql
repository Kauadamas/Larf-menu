CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`type` enum('review','suggestion','complaint') NOT NULL DEFAULT 'review',
	`rating` int,
	`name` varchar(255),
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `companies` ADD `logoKey` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `website` varchar(255);--> statement-breakpoint
ALTER TABLE `companies` ADD `facebook` varchar(255);--> statement-breakpoint
ALTER TABLE `companies` ADD `instagram` varchar(255);--> statement-breakpoint
ALTER TABLE `companies` ADD `whatsapp` varchar(50);--> statement-breakpoint
ALTER TABLE `companies` ADD `colorTheme` enum('orange','green','blue','purple','red') DEFAULT 'orange' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `deliveryEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `deliveryFee` decimal(10,2);--> statement-breakpoint
ALTER TABLE `companies` ADD `deliveryMinOrder` decimal(10,2);--> statement-breakpoint
ALTER TABLE `companies` ADD `paymentMercadoPago` varchar(500);--> statement-breakpoint
ALTER TABLE `companies` ADD `paymentPagSeguro` varchar(500);--> statement-breakpoint
ALTER TABLE `companies` ADD `paymentPicPay` varchar(500);--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;