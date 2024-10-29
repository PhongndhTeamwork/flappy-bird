/*
  Warnings:

  - Made the column `point` on table `account` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "account" ALTER COLUMN "point" SET NOT NULL,
ALTER COLUMN "point" SET DEFAULT 0;
