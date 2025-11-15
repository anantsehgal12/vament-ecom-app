/*
  Warnings:

  - You are about to drop the column `details` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `highlights` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `href` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Breadcrumb` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `categoryId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Breadcrumb" DROP CONSTRAINT "Breadcrumb_productId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "details",
DROP COLUMN "highlights",
DROP COLUMN "href",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Breadcrumb";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
