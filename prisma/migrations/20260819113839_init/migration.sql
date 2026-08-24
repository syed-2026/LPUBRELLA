-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "UmbrellaStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'MISSING', 'LOST', 'RETIRED');

-- CreateEnum
CREATE TYPE "UmbrellaCondition" AS ENUM ('GOOD', 'FAIR', 'DAMAGED');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('CREATED', 'PAYMENT_PENDING', 'ACTIVE', 'OVERDUE', 'RETURN_PENDING', 'COMPLETED', 'CANCELLED', 'LOST');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'VERIFIED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DamageSeverity" AS ENUM ('MINOR', 'MAJOR', 'UNUSABLE');

-- CreateEnum
CREATE TYPE "DamageReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED');

-- CreateEnum
CREATE TYPE "RebalancingTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RENTAL_ACTIVATED', 'RENTAL_OVERDUE', 'RETURN_COMPLETED', 'PAYMENT_VERIFIED', 'PAYMENT_FAILED', 'GENERAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'REGISTER', 'RENTAL_CREATED', 'PAYMENT_CREATED', 'PAYMENT_VERIFIED', 'PAYMENT_FAILED', 'RENTAL_ACTIVATED', 'RETURN_TOKEN_CREATED', 'RETURN_COMPLETED', 'RENTAL_MARKED_OVERDUE', 'RENTAL_CANCELLED', 'UMBRELLA_MARKED_MAINTENANCE', 'UMBRELLA_MARKED_MISSING', 'UMBRELLA_MARKED_LOST', 'UMBRELLA_MARKED_AVAILABLE', 'INVENTORY_MOVED', 'ADMIN_ACTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "lpuId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedStationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "StationStatus" NOT NULL DEFAULT 'ACTIVE',
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Umbrella" (
    "id" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "qrIdentifier" TEXT NOT NULL,
    "status" "UmbrellaStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" "UmbrellaCondition" NOT NULL DEFAULT 'GOOD',
    "currentStationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Umbrella_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "umbrellaId" TEXT NOT NULL,
    "pricingPlanId" TEXT NOT NULL,
    "priceAtRentalPaise" INTEGER NOT NULL,
    "durationMinutesAtRental" INTEGER NOT NULL,
    "status" "RentalStatus" NOT NULL DEFAULT 'CREATED',
    "originStationId" TEXT NOT NULL,
    "returnStationId" TEXT,
    "startedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageReport" (
    "id" TEXT NOT NULL,
    "umbrellaId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "severity" "DamageSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DamageReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DamageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RebalancingTask" (
    "id" TEXT NOT NULL,
    "fromStationId" TEXT NOT NULL,
    "toStationId" TEXT NOT NULL,
    "umbrellaCount" INTEGER NOT NULL,
    "status" "RebalancingTaskStatus" NOT NULL DEFAULT 'PENDING',
    "assignedStaffId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RebalancingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_lpuId_key" ON "User"("lpuId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Station_code_key" ON "Station"("code");

-- CreateIndex
CREATE INDEX "Station_status_idx" ON "Station"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Umbrella_publicCode_key" ON "Umbrella"("publicCode");

-- CreateIndex
CREATE UNIQUE INDEX "Umbrella_qrIdentifier_key" ON "Umbrella"("qrIdentifier");

-- CreateIndex
CREATE INDEX "Umbrella_status_idx" ON "Umbrella"("status");

-- CreateIndex
CREATE INDEX "Umbrella_currentStationId_idx" ON "Umbrella"("currentStationId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingPlan_name_key" ON "PricingPlan"("name");

-- CreateIndex
CREATE INDEX "Rental_studentId_idx" ON "Rental"("studentId");

-- CreateIndex
CREATE INDEX "Rental_umbrellaId_idx" ON "Rental"("umbrellaId");

-- CreateIndex
CREATE INDEX "Rental_status_idx" ON "Rental"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_rentalId_key" ON "Payment"("rentalId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerOrderId_key" ON "Payment"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnToken_tokenHash_key" ON "ReturnToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ReturnToken_rentalId_idx" ON "ReturnToken"("rentalId");

-- CreateIndex
CREATE INDEX "ReturnToken_expiresAt_idx" ON "ReturnToken"("expiresAt");

-- CreateIndex
CREATE INDEX "DamageReport_umbrellaId_idx" ON "DamageReport"("umbrellaId");

-- CreateIndex
CREATE INDEX "DamageReport_status_idx" ON "DamageReport"("status");

-- CreateIndex
CREATE INDEX "RebalancingTask_status_idx" ON "RebalancingTask"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedStationId_fkey" FOREIGN KEY ("assignedStationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Umbrella" ADD CONSTRAINT "Umbrella_currentStationId_fkey" FOREIGN KEY ("currentStationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_umbrellaId_fkey" FOREIGN KEY ("umbrellaId") REFERENCES "Umbrella"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES "PricingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_originStationId_fkey" FOREIGN KEY ("originStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_returnStationId_fkey" FOREIGN KEY ("returnStationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnToken" ADD CONSTRAINT "ReturnToken_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnToken" ADD CONSTRAINT "ReturnToken_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnToken" ADD CONSTRAINT "ReturnToken_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_umbrellaId_fkey" FOREIGN KEY ("umbrellaId") REFERENCES "Umbrella"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalancingTask" ADD CONSTRAINT "RebalancingTask_fromStationId_fkey" FOREIGN KEY ("fromStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalancingTask" ADD CONSTRAINT "RebalancingTask_toStationId_fkey" FOREIGN KEY ("toStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RebalancingTask" ADD CONSTRAINT "RebalancingTask_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
