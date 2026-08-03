-- AlterTable
ALTER TABLE "songs" ADD COLUMN "genre" VARCHAR(100),
ADD COLUMN "description" VARCHAR(500);

-- AlterTable
ALTER TABLE "albums" ADD COLUMN "genre" VARCHAR(100),
ADD COLUMN "description" VARCHAR(500);
