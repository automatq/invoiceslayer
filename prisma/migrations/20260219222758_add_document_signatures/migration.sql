-- CreateTable
CREATE TABLE "DocumentSignature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "documentHash" TEXT NOT NULL,
    "metadata" TEXT,
    CONSTRAINT "DocumentSignature_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
