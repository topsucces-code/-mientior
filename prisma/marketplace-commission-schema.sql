-- Marketplace Commission System Schema Updates
-- Execute this migration to enable the advanced commission system
-- Add commission fields to OrderItem
ALTER TABLE "OrderItem"
ADD COLUMN "vendorId" TEXT,
    ADD COLUMN "commissionRate" DECIMAL(5, 4) DEFAULT 0.15,
    ADD COLUMN "commissionAmount" INTEGER DEFAULT 0,
    ADD COLUMN "vendorAmount" INTEGER DEFAULT 0,
    ADD COLUMN "commissionDetails" JSONB;
-- Add foreign key constraint
ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- Add balance fields to Vendor
ALTER TABLE "Vendor"
ADD COLUMN "balance" INTEGER DEFAULT 0,
    ADD COLUMN "pendingBalance" INTEGER DEFAULT 0,
    ADD COLUMN "lastSaleAt" TIMESTAMP(3),
    ADD COLUMN "totalOrders" INTEGER DEFAULT 0;
-- Create VendorTransaction table
CREATE TABLE "VendorTransaction" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    -- SALE, COMMISSION, PAYOUT, REFUND, ADJUSTMENT
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "payoutId" TEXT,
    "balanceBefore" INTEGER NOT NULL DEFAULT 0,
    "balanceAfter" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorTransaction_pkey" PRIMARY KEY ("id")
);
-- Create VendorPerformanceMetrics table
CREATE TABLE "VendorPerformanceMetrics" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    "disputeRate" DECIMAL(5, 4) NOT NULL DEFAULT 0.0000,
    "onTimeDeliveryRate" DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
    "returnRate" DECIMAL(5, 4) NOT NULL DEFAULT 0.0000,
    "tier" TEXT NOT NULL DEFAULT 'BRONZE',
    -- BRONZE, SILVER, GOLD, PLATINUM
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorPerformanceMetrics_pkey" PRIMARY KEY ("id")
);
-- Create PayoutRequest table
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "method" TEXT NOT NULL,
    -- MOBILE_MONEY, BANK_TRANSFER, CASH
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    -- PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
    "transactionId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);
-- Create VendorPayoutSettings table
CREATE TABLE "VendorPayoutSettings" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "autoPayoutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minimumPayoutAmount" INTEGER NOT NULL DEFAULT 100000,
    -- 100,000 XOF
    "preferredMethod" TEXT NOT NULL DEFAULT 'MOBILE_MONEY',
    "mobileMoneyProvider" TEXT,
    -- ORANGE, MTN, MOOV
    "phoneNumber" TEXT,
    "bankAccountNumber" TEXT,
    "bankCode" TEXT,
    "payoutSchedule" TEXT NOT NULL DEFAULT 'WEEKLY',
    -- DAILY, WEEKLY, MONTHLY
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorPayoutSettings_pkey" PRIMARY KEY ("id")
);
-- Create CommissionTier table for dynamic rate management
CREATE TABLE "CommissionTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    -- BRONZE, SILVER, GOLD, PLATINUM
    "baseRate" DECIMAL(5, 4) NOT NULL,
    "minimumSales" INTEGER NOT NULL DEFAULT 0,
    "minimumRating" DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    "maximumDisputeRate" DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommissionTier_pkey" PRIMARY KEY ("id")
);
-- Create CategoryCommission table for category-specific rates
CREATE TABLE "CategoryCommission" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "modifier" DECIMAL(5, 4) NOT NULL DEFAULT 0.0000,
    -- Added/subtracted from base rate
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CategoryCommission_pkey" PRIMARY KEY ("id")
);
-- Create Dispute table for tracking vendor disputes
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    -- PRODUCT_QUALITY, DELIVERY_DELAY, WRONG_ITEM, DAMAGED_ITEM
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    -- OPEN, IN_REVIEW, RESOLVED, CLOSED
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);
-- Add foreign key constraints
ALTER TABLE "VendorTransaction"
ADD CONSTRAINT "VendorTransaction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorTransaction"
ADD CONSTRAINT "VendorTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE "VendorPerformanceMetrics"
ADD CONSTRAINT "VendorPerformanceMetrics_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PayoutRequest"
ADD CONSTRAINT "PayoutRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorPayoutSettings"
ADD CONSTRAINT "VendorPayoutSettings_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategoryCommission"
ADD CONSTRAINT "CategoryCommission_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dispute"
ADD CONSTRAINT "Dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Dispute"
ADD CONSTRAINT "Dispute_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Dispute"
ADD CONSTRAINT "Dispute_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Add unique constraints
ALTER TABLE "VendorPerformanceMetrics"
ADD CONSTRAINT "VendorPerformanceMetrics_vendorId_key" UNIQUE ("vendorId");
ALTER TABLE "VendorPayoutSettings"
ADD CONSTRAINT "VendorPayoutSettings_vendorId_key" UNIQUE ("vendorId");
ALTER TABLE "CategoryCommission"
ADD CONSTRAINT "CategoryCommission_categoryId_key" UNIQUE ("categoryId");
ALTER TABLE "CommissionTier"
ADD CONSTRAINT "CommissionTier_tier_key" UNIQUE ("tier");
-- Create indexes for performance
CREATE INDEX "VendorTransaction_vendorId_idx" ON "VendorTransaction"("vendorId");
CREATE INDEX "VendorTransaction_type_idx" ON "VendorTransaction"("type");
CREATE INDEX "VendorTransaction_createdAt_idx" ON "VendorTransaction"("createdAt");
CREATE INDEX "VendorTransaction_orderId_idx" ON "VendorTransaction"("orderId");
CREATE INDEX "PayoutRequest_vendorId_idx" ON "PayoutRequest"("vendorId");
CREATE INDEX "PayoutRequest_status_idx" ON "PayoutRequest"("status");
CREATE INDEX "PayoutRequest_scheduledAt_idx" ON "PayoutRequest"("scheduledAt");
CREATE INDEX "Dispute_orderId_idx" ON "Dispute"("orderId");
CREATE INDEX "Dispute_vendorId_idx" ON "Dispute"("vendorId");
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");
CREATE INDEX "Dispute_createdAt_idx" ON "Dispute"("createdAt");
CREATE INDEX "OrderItem_vendorId_idx" ON "OrderItem"("vendorId");
-- Insert default commission tiers
INSERT INTO "CommissionTier" (
        "id",
        "name",
        "tier",
        "baseRate",
        "minimumSales",
        "minimumRating",
        "maximumDisputeRate"
    )
VALUES (
        'tier_bronze',
        'Bronze - Nouveaux vendeurs',
        'BRONZE',
        0.1500,
        0,
        0.00,
        1.0000
    ),
    (
        'tier_silver',
        'Silver - Vendeurs établis',
        'SILVER',
        0.1200,
        1000000,
        4.00,
        0.0500
    ),
    (
        'tier_gold',
        'Gold - Vendeurs performants',
        'GOLD',
        0.1000,
        5000000,
        4.50,
        0.0200
    ),
    (
        'tier_platinum',
        'Platinum - Vendeurs d''élite',
        'PLATINUM',
        0.0800,
        10000000,
        4.80,
        0.0100
    );
-- Insert default category commission modifiers
INSERT INTO "CategoryCommission" ("id", "categoryId", "modifier", "description")
VALUES (
        'cat_electronics',
        'electronics',
        -0.0200,
        'Réduction pour électronique (articles de valeur élevée)'
    ),
    (
        'cat_fashion',
        'fashion',
        0.0000,
        'Taux standard pour mode'
    ),
    (
        'cat_food',
        'food-beverage',
        0.0100,
        'Majoration pour produits périssables'
    ),
    (
        'cat_services',
        'services',
        -0.0100,
        'Réduction pour services'
    ),
    (
        'cat_handmade',
        'handmade',
        -0.0300,
        'Soutien aux artisans locaux'
    );
-- Create view for vendor dashboard analytics
CREATE VIEW "VendorDashboardStats" AS
SELECT v."id" as "vendorId",
    v."businessName",
    v."balance",
    v."pendingBalance",
    v."totalSales",
    v."totalOrders",
    vpm."averageRating",
    vpm."disputeRate",
    vpm."tier",
    COUNT(DISTINCT o."id") as "recentOrders",
    SUM(
        CASE
            WHEN o."status" = 'COMPLETED' THEN o."total"
            ELSE 0
        END
    ) as "recentSales"
FROM "Vendor" v
    LEFT JOIN "VendorPerformanceMetrics" vpm ON v."id" = vpm."vendorId"
    LEFT JOIN "OrderItem" oi ON v."id" = oi."vendorId"
    LEFT JOIN "Order" o ON oi."orderId" = o."id"
    AND o."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY v."id",
    v."businessName",
    v."balance",
    v."pendingBalance",
    v."totalSales",
    v."totalOrders",
    vpm."averageRating",
    vpm."disputeRate",
    vpm."tier";
-- Create function to automatically update vendor metrics
CREATE OR REPLACE FUNCTION update_vendor_metrics() RETURNS TRIGGER AS $$ BEGIN -- Update vendor total sales and orders when order is completed
    IF NEW."status" = 'COMPLETED'
    AND OLD."status" != 'COMPLETED' THEN
UPDATE "Vendor"
SET "totalSales" = "totalSales" + NEW."total",
    "totalOrders" = "totalOrders" + 1,
    "lastSaleAt" = NOW()
WHERE "id" IN (
        SELECT DISTINCT p."vendorId"
        FROM "OrderItem" oi
            JOIN "Product" p ON oi."productId" = p."id"
        WHERE oi."orderId" = NEW."id"
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for automatic vendor metrics update
CREATE TRIGGER update_vendor_metrics_trigger
AFTER
UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION update_vendor_metrics();
-- Add comments for documentation
COMMENT ON TABLE "VendorTransaction" IS 'Tracks all financial transactions for vendors including sales, commissions, and payouts';
COMMENT ON TABLE "VendorPerformanceMetrics" IS 'Stores vendor performance data used for tier calculation and commission rates';
COMMENT ON TABLE "PayoutRequest" IS 'Manages vendor payout requests with support for Mobile Money in Côte d''Ivoire';
COMMENT ON TABLE "VendorPayoutSettings" IS 'Vendor preferences for automatic payouts and payment methods';
COMMENT ON TABLE "CommissionTier" IS 'Defines commission rates based on vendor performance tiers';
COMMENT ON TABLE "CategoryCommission" IS 'Category-specific commission rate modifiers';
COMMENT ON TABLE "Dispute" IS 'Tracks customer disputes against vendors for performance metrics';
COMMENT ON COLUMN "OrderItem"."commissionRate" IS 'Final commission rate applied (base rate + modifiers)';
COMMENT ON COLUMN "OrderItem"."commissionAmount" IS 'Platform commission amount in cents';
COMMENT ON COLUMN "OrderItem"."vendorAmount" IS 'Amount credited to vendor after commission in cents';
COMMENT ON COLUMN "OrderItem"."commissionDetails" IS 'JSON object with detailed commission calculation breakdown';
COMMENT ON COLUMN "Vendor"."balance" IS 'Available balance for payout in cents (XOF)';
COMMENT ON COLUMN "Vendor"."pendingBalance" IS 'Pending balance from recent sales in cents (XOF)';
COMMENT ON COLUMN "VendorPerformanceMetrics"."tier" IS 'Current vendor tier: BRONZE, SILVER, GOLD, PLATINUM';
COMMENT ON COLUMN "PayoutRequest"."method" IS 'Payout method: MOBILE_MONEY, BANK_TRANSFER, CASH';
COMMENT ON COLUMN "VendorPayoutSettings"."mobileMoneyProvider" IS 'Mobile Money provider: ORANGE, MTN, MOOV for Côte d''Ivoire market';