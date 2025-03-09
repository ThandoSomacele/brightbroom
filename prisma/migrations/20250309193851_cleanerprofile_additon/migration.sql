-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('SOUTH_AFRICAN_ID', 'PASSPORT');

-- CreateEnum
CREATE TYPE "PetCompatibility" AS ENUM ('NONE', 'DOGS', 'CATS', 'BOTH');

-- CreateTable
CREATE TABLE "CleanerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idType" "IdType" NOT NULL,
    "idNumber" TEXT NOT NULL,
    "taxNumber" TEXT,
    "bankAccount" TEXT,
    "workLocationLat" DOUBLE PRECISION NOT NULL,
    "workLocationLng" DOUBLE PRECISION NOT NULL,
    "workAddress" TEXT NOT NULL,
    "bio" TEXT,
    "petCompatibility" "PetCompatibility" NOT NULL DEFAULT 'NONE',
    "availableDays" "DayOfWeek"[],
    "rating" DOUBLE PRECISION,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerSpecialization" (
    "id" TEXT NOT NULL,
    "cleanerProfileId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,

    CONSTRAINT "CleanerSpecialization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CleanerProfile_userId_key" ON "CleanerProfile"("userId");

-- AddForeignKey
ALTER TABLE "CleanerProfile" ADD CONSTRAINT "CleanerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerSpecialization" ADD CONSTRAINT "CleanerSpecialization_cleanerProfileId_fkey" FOREIGN KEY ("cleanerProfileId") REFERENCES "CleanerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerSpecialization" ADD CONSTRAINT "CleanerSpecialization_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
