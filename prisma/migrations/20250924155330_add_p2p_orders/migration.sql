-- CreateTable
CREATE TABLE "public"."P2POrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cryptocurrency" TEXT NOT NULL,
    "fiatCurrency" TEXT NOT NULL DEFAULT 'INR',
    "price" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "minLimit" DECIMAL(10,2) NOT NULL,
    "maxLimit" DECIMAL(15,2) NOT NULL,
    "availableAmount" DECIMAL(15,2) NOT NULL,
    "paymentMethods" TEXT[],
    "timeLimit" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "completionRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "P2POrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "P2POrder_cryptocurrency_type_status_idx" ON "public"."P2POrder"("cryptocurrency", "type", "status");

-- CreateIndex
CREATE INDEX "P2POrder_price_idx" ON "public"."P2POrder"("price");
