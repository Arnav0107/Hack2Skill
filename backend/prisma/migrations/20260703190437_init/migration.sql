-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "msme_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "gstin" TEXT,
    "sector" TEXT,
    "region" TEXT,
    "employee_band" TEXT,
    "registered_on" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "msme_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "msme_id" TEXT NOT NULL,
    "data_source" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL DEFAULT true,
    "consented_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consents_msme_id_fkey" FOREIGN KEY ("msme_id") REFERENCES "msme_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gst_filings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "msme_id" TEXT NOT NULL,
    "period" DATETIME NOT NULL,
    "filed_on_time" BOOLEAN NOT NULL,
    "turnover" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gst_filings_msme_id_fkey" FOREIGN KEY ("msme_id") REFERENCES "msme_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "upi_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "msme_id" TEXT NOT NULL,
    "txn_date" DATETIME NOT NULL,
    "txn_type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "flagged_large" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "upi_transactions_msme_id_fkey" FOREIGN KEY ("msme_id") REFERENCES "msme_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "epfo_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "msme_id" TEXT NOT NULL,
    "period" DATETIME NOT NULL,
    "employee_count" INTEGER NOT NULL,
    "contribution_paid" BOOLEAN NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "epfo_records_msme_id_fkey" FOREIGN KEY ("msme_id") REFERENCES "msme_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "msme_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "is_provisional" BOOLEAN NOT NULL DEFAULT false,
    "alpha" REAL NOT NULL,
    "model_version" TEXT NOT NULL DEFAULT 'stub-v0',
    "computed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scores_msme_id_fkey" FOREIGN KEY ("msme_id") REFERENCES "msme_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "score_breakdown" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "score_id" TEXT NOT NULL,
    "card_label" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "explanation" TEXT,
    CONSTRAINT "score_breakdown_score_id_fkey" FOREIGN KEY ("score_id") REFERENCES "scores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fraud_flags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "msme_id" TEXT NOT NULL,
    "rule_triggered" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT,
    "detected_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fraud_flags_msme_id_fkey" FOREIGN KEY ("msme_id") REFERENCES "msme_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journey_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "msme_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "next_action" TEXT,
    "projected_score_low" INTEGER NOT NULL,
    "projected_score_high" INTEGER NOT NULL,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "journey_milestones_msme_id_fkey" FOREIGN KEY ("msme_id") REFERENCES "msme_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "score_id" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "ipfs_cid" TEXT NOT NULL,
    "chain_tx_hash" TEXT NOT NULL,
    "chain_network" TEXT NOT NULL DEFAULT 'polygon-amoy',
    "anchored_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_records_score_id_fkey" FOREIGN KEY ("score_id") REFERENCES "scores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sector_priors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sector" TEXT,
    "region" TEXT,
    "employee_band" TEXT,
    "prior_score_mean" INTEGER NOT NULL,
    "prior_score_std" INTEGER NOT NULL,
    "sample_size" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
