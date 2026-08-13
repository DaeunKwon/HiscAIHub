-- 기획서 개정(2026-08-13) 반영 — 에이전트 단일 체계 전환.
-- 프롬프트·좋아요 제거, 후기(Review)·산출물(AgentOutput)·구독현황 신설,
-- 부서 확산 집계용 AuditLog.deptSnapshot 추가.
--
-- Agent에 NOT NULL 컬럼(runType/trigger/targetTask/effect)이, AuditLog에 deptSnapshot이 붙고
-- Save/Report의 agentId가 NOT NULL로 바뀐다. 기존 행은 이 값을 채울 방법이 없으므로
-- 개발 시드 데이터를 먼저 비운다. 재적재는 `npm run db:seed`.
-- User/Category/Setting은 유지한다.
DELETE FROM "Like";
DELETE FROM "Comment";
DELETE FROM "Save";
DELETE FROM "Report";
DELETE FROM "Notification";
DELETE FROM "AuditLog";
DELETE FROM "UsageLog";
DELETE FROM "Prompt";
DELETE FROM "Agent";

-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('schedule', 'event', 'skill', 'app');

-- CreateEnum
CREATE TYPE "TimeBand" AS ENUM ('under_10m', 'm10_30', 'm30_60', 'h1_3', 'h3_8', 'over_1d');

-- CreateEnum
CREATE TYPE "SubScope" AS ENUM ('division', 'team');

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('agent_generate', 'agent_create', 'agent_update', 'agent_delete', 'agent_run', 'agent_copy');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('review');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_promptId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_promptId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_promptId_fkey";

-- DropForeignKey
ALTER TABLE "Prompt" DROP CONSTRAINT "Prompt_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_promptId_fkey";

-- DropForeignKey
ALTER TABLE "Save" DROP CONSTRAINT "Save_promptId_fkey";

-- DropIndex
DROP INDEX "Report_promptId_idx";

-- DropIndex
DROP INDEX "Save_promptId_idx";

-- DropIndex
DROP INDEX "Save_userId_promptId_key";

-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "exampleTasks",
DROP COLUMN "likeCount",
ADD COLUMN     "effect" TEXT NOT NULL,
ADD COLUMN     "howToUse" TEXT[],
ADD COLUMN     "linkUrl" TEXT,
ADD COLUMN     "prerequisites" TEXT[],
ADD COLUMN     "runType" "RunType" NOT NULL,
ADD COLUMN     "targetTask" TEXT NOT NULL,
ADD COLUMN     "tasks" TEXT[],
ADD COLUMN     "timeAfter" "TimeBand",
ADD COLUMN     "timeBefore" "TimeBand",
ADD COLUMN     "tools" TEXT[],
ADD COLUMN     "trigger" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "deptSnapshot" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "commentText",
DROP COLUMN "promptId",
ADD COLUMN     "reviewText" TEXT;

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "promptId",
ALTER COLUMN "agentId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Save" DROP COLUMN "promptId",
ALTER COLUMN "agentId" SET NOT NULL;

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Like";

-- DropTable
DROP TABLE "Prompt";

-- CreateTable
CREATE TABLE "AgentOutput" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AgentOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "useCase" TEXT,
    "effect" TEXT NOT NULL,
    "timeBefore" "TimeBand",
    "timeAfter" "TimeBand",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionSnapshot" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "totalAccounts" INTEGER NOT NULL,
    "totalCostManwon" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionRow" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "scope" "SubScope" NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT,
    "users" INTEGER NOT NULL,
    "costManwon" INTEGER NOT NULL,
    "tools" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SubscriptionRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentOutput_agentId_idx" ON "AgentOutput"("agentId");

-- CreateIndex
CREATE INDEX "Review_agentId_idx" ON "Review"("agentId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionSnapshot_period_key" ON "SubscriptionSnapshot"("period");

-- CreateIndex
CREATE INDEX "SubscriptionRow_snapshotId_idx" ON "SubscriptionRow"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionRow_snapshotId_scope_name_key" ON "SubscriptionRow"("snapshotId", "scope", "name");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_idx" ON "AuditLog"("targetId");

-- AddForeignKey
ALTER TABLE "AgentOutput" ADD CONSTRAINT "AgentOutput_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRow" ADD CONSTRAINT "SubscriptionRow_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "SubscriptionSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
