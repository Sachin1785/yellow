-- CreateTable
CREATE TABLE "public"."Razorpay" (
    "id" SERIAL NOT NULL,
    "contactId" TEXT NOT NULL,
    "fundAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Razorpay_pkey" PRIMARY KEY ("id")
);
