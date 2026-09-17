-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroEyebrow" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "heroDescription" TEXT NOT NULL,
    "heroCtaLabel" TEXT NOT NULL,
    "heroCtaUrl" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "whatsappNumber" TEXT NOT NULL,
    "whatsappMessage" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "announcementItem1" TEXT NOT NULL,
    "announcementItem2" TEXT NOT NULL,
    "announcementItem3" TEXT NOT NULL,
    "announcementItem4" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
