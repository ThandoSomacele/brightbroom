/*
  Warnings:

  - Added the required column `workRadius` to the `CleanerProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CleanerProfile" ADD COLUMN     "workRadius" DOUBLE PRECISION NOT NULL;
