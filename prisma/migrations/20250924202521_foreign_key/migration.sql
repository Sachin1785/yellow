/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Razorpay` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Razorpay` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Razorpay" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Razorpay_userId_key" ON "public"."Razorpay"("userId");

-- AddForeignKey
ALTER TABLE "public"."Razorpay" ADD CONSTRAINT "Razorpay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
