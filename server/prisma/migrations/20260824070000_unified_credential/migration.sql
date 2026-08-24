-- DropTable
DROP TABLE "internalops"."StaffCredential";

-- CreateTable
CREATE TABLE "identity"."Credential" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Credential_accountId_key" ON "identity"."Credential"("accountId");

-- AddForeignKey
ALTER TABLE "identity"."Credential" ADD CONSTRAINT "Credential_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "identity"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

