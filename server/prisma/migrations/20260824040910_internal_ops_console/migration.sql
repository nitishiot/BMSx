-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "internalops";

-- CreateTable
CREATE TABLE "internalops"."OrgRole" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "personName" TEXT,
    "reportsToOrgRoleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internalops"."Capability" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internalops"."OrgRoleCapability" (
    "id" TEXT NOT NULL,
    "orgRoleId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,

    CONSTRAINT "OrgRoleCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internalops"."StaffProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "orgRoleId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgRole_key_key" ON "internalops"."OrgRole"("key");

-- CreateIndex
CREATE INDEX "OrgRole_reportsToOrgRoleId_idx" ON "internalops"."OrgRole"("reportsToOrgRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_key_key" ON "internalops"."Capability"("key");

-- CreateIndex
CREATE UNIQUE INDEX "OrgRoleCapability_orgRoleId_capabilityId_key" ON "internalops"."OrgRoleCapability"("orgRoleId", "capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_accountId_key" ON "internalops"."StaffProfile"("accountId");

-- CreateIndex
CREATE INDEX "StaffProfile_accountId_idx" ON "internalops"."StaffProfile"("accountId");

-- AddForeignKey
ALTER TABLE "internalops"."OrgRole" ADD CONSTRAINT "OrgRole_reportsToOrgRoleId_fkey" FOREIGN KEY ("reportsToOrgRoleId") REFERENCES "internalops"."OrgRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internalops"."OrgRoleCapability" ADD CONSTRAINT "OrgRoleCapability_orgRoleId_fkey" FOREIGN KEY ("orgRoleId") REFERENCES "internalops"."OrgRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internalops"."OrgRoleCapability" ADD CONSTRAINT "OrgRoleCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "internalops"."Capability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internalops"."StaffProfile" ADD CONSTRAINT "StaffProfile_orgRoleId_fkey" FOREIGN KEY ("orgRoleId") REFERENCES "internalops"."OrgRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
