-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "inventory";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "orders";

-- CreateEnum
CREATE TYPE "inventory"."HoldStatus" AS ENUM ('active', 'converted', 'released', 'expired');

-- CreateEnum
CREATE TYPE "orders"."CartStatus" AS ENUM ('open', 'checked_out', 'abandoned');

-- CreateEnum
CREATE TYPE "orders"."OrderStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "inventory"."TicketType" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMinorUnits" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."Allocation" (
    "id" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."Hold" (
    "id" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "inventory"."HoldStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."Ticket" (
    "id" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "holderName" TEXT,
    "qrCode" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders"."Cart" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "status" "orders"."CartStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders"."CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinorUnits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders"."Order" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "accountId" TEXT,
    "guestEmail" TEXT,
    "guestName" TEXT,
    "subtotalMinorUnits" INTEGER NOT NULL,
    "feeMinorUnits" INTEGER NOT NULL,
    "totalMinorUnits" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "orders"."OrderStatus" NOT NULL DEFAULT 'pending',
    "paymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders"."OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceMinorUnits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketType_zoneId_idx" ON "inventory"."TicketType"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_ticketTypeId_key" ON "inventory"."Allocation"("ticketTypeId");

-- CreateIndex
CREATE INDEX "Hold_ticketTypeId_idx" ON "inventory"."Hold"("ticketTypeId");

-- CreateIndex
CREATE INDEX "Hold_cartId_idx" ON "inventory"."Hold"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_qrCode_key" ON "inventory"."Ticket"("qrCode");

-- CreateIndex
CREATE INDEX "Ticket_orderId_idx" ON "inventory"."Ticket"("orderId");

-- CreateIndex
CREATE INDEX "Cart_accountId_idx" ON "orders"."Cart"("accountId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "orders"."CartItem"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_cartId_key" ON "orders"."Order"("cartId");

-- CreateIndex
CREATE INDEX "Order_accountId_idx" ON "orders"."Order"("accountId");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "orders"."OrderLine"("orderId");

-- AddForeignKey
ALTER TABLE "inventory"."Allocation" ADD CONSTRAINT "Allocation_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "inventory"."TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."Hold" ADD CONSTRAINT "Hold_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "inventory"."TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."Ticket" ADD CONSTRAINT "Ticket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "inventory"."TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."Ticket" ADD CONSTRAINT "Ticket_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "inventory"."Hold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "orders"."Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."Order" ADD CONSTRAINT "Order_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "orders"."Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders"."OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
