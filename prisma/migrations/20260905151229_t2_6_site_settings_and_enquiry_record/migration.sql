-- CreateTable
CREATE TABLE "site_settings" (
    "id" SERIAL NOT NULL,
    "phone_primary" TEXT NOT NULL,
    "phone_secondary" TEXT,
    "email" TEXT NOT NULL,
    "whatsapp_number" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "response_time_commitment" TEXT,
    "social_profile_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry_record" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "service_line" TEXT,
    "contact_consent" BOOLEAN NOT NULL,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "score_summary" JSONB,
    "weakest_dimensions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "triage_flag" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_record_pkey" PRIMARY KEY ("id")
);
