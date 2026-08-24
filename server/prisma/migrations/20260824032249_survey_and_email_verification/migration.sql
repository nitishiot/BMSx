-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "survey";

-- AlterTable
ALTER TABLE "identity"."Account" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "identity"."EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey"."SurveyResponse" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "identity"."EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_accountId_idx" ON "identity"."EmailVerificationToken"("accountId");

-- CreateIndex
CREATE INDEX "SurveyResponse_accountId_idx" ON "survey"."SurveyResponse"("accountId");

-- AddForeignKey
ALTER TABLE "identity"."EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "identity"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
