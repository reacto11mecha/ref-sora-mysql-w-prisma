-- CreateTable
CREATE TABLE `Candidate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `counter` INTEGER NOT NULL DEFAULT 0,
    `name` VARCHAR(191) NOT NULL,
    `img` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `Candidate_name_key`(`name`),
    UNIQUE INDEX `Candidate_img_key`(`img`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Participant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `qrId` VARCHAR(30) NOT NULL,
    `alreadyAttended` BOOLEAN NOT NULL DEFAULT false,
    `attendedAt` DATETIME(3) NULL,
    `alreadyChoosing` BOOLEAN NOT NULL DEFAULT false,
    `choosingAt` DATETIME(3) NULL,

    UNIQUE INDEX `Participant_name_key`(`name`),
    UNIQUE INDEX `Participant_qrId_key`(`qrId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
