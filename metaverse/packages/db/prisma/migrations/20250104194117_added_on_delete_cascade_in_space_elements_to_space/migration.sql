-- DropForeignKey
ALTER TABLE "SpaceElements" DROP CONSTRAINT "SpaceElements_spaceId_fkey";

-- AddForeignKey
ALTER TABLE "SpaceElements" ADD CONSTRAINT "SpaceElements_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
