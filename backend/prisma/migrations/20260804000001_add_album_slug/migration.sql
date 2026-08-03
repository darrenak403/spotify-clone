-- AlterTable
ALTER TABLE "albums" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "albums_slug_key" ON "albums"("slug");
