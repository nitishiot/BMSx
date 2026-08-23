-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalogue";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateEnum
CREATE TYPE "catalogue"."ProducerApplicationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "identity"."Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."RoleAssignment" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."Session" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."AuditLogEntry" (
    "id" TEXT NOT NULL,
    "actorLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogue"."ProducerApplication" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "festivalName" TEXT NOT NULL,
    "status" "catalogue"."ProducerApplicationStatus" NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "decisionReason" TEXT,

    CONSTRAINT "ProducerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogue"."Festival" (
    "id" TEXT NOT NULL,
    "producerAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Festival_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "identity"."Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "identity"."Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_accountId_roleId_key" ON "identity"."RoleAssignment"("accountId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "identity"."Session"("token");

-- CreateIndex
CREATE INDEX "AuditLogEntry_targetType_targetId_idx" ON "identity"."AuditLogEntry"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLogEntry_actorLabel_idx" ON "identity"."AuditLogEntry"("actorLabel");

-- CreateIndex
CREATE INDEX "ProducerApplication_accountId_idx" ON "catalogue"."ProducerApplication"("accountId");

-- CreateIndex
CREATE INDEX "ProducerApplication_status_idx" ON "catalogue"."ProducerApplication"("status");

-- CreateIndex
CREATE INDEX "Festival_producerAccountId_idx" ON "catalogue"."Festival"("producerAccountId");

-- AddForeignKey
ALTER TABLE "identity"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "identity"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "identity"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."Session" ADD CONSTRAINT "Session_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "identity"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
