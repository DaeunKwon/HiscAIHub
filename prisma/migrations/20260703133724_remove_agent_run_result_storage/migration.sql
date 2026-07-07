/*
  Warnings:

  - You are about to drop the `AgentRun` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RunFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AgentRun" DROP CONSTRAINT "AgentRun_agentId_fkey";

-- DropForeignKey
ALTER TABLE "AgentRun" DROP CONSTRAINT "AgentRun_userId_fkey";

-- DropForeignKey
ALTER TABLE "RunFile" DROP CONSTRAINT "RunFile_agentRunId_fkey";

-- DropTable
DROP TABLE "AgentRun";

-- DropTable
DROP TABLE "RunFile";
