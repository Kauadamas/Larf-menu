ALTER TABLE `companies` MODIFY COLUMN `colorTheme` varchar(30) NOT NULL DEFAULT '#f97316';--> statement-breakpoint
ALTER TABLE `companies` ADD `googleReviewsUrl` varchar(500);