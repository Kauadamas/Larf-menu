CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`asaasPaymentId` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`dueDate` timestamp NOT NULL,
	`paidAt` timestamp,
	`paymentMethod` varchar(50),
	`pixQrCodeUrl` text,
	`pixPayload` text,
	`boletoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_asaasPaymentId_unique` UNIQUE(`asaasPaymentId`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`priceMonthly` int NOT NULL,
	`trialDays` int NOT NULL DEFAULT 14,
	`maxUsers` int,
	`maxUnits` int NOT NULL DEFAULT 1,
	`features` text NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`asaasCustomerId` varchar(255),
	`asaasSubId` varchar(255),
	`status` enum('trialing','active','past_due','suspended','cancelled') NOT NULL DEFAULT 'trialing',
	`trialEndsAt` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifiedAt` t