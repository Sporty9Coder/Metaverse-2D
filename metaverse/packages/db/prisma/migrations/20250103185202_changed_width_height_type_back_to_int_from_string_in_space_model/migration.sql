/*
  Warnings:

  - The `height` column on the `Space` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `width` on the `Space` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Space" DROP COLUMN "width",
ADD COLUMN     "width" INTEGER NOT NULL,
DROP COLUMN "height",
ADD COLUMN     "height" INTEGER;
