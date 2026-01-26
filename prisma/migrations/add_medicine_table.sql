-- Create Medicine table
CREATE TABLE IF NOT EXISTS "Medicine" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "dosage" TEXT,
    "administration" TEXT,
    "unit" TEXT,
    "time" TEXT,
    "when" TEXT,
    "where" TEXT,
    "genericName" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "qty" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Medicine_doctorId_idx" ON "Medicine"("doctorId");
CREATE INDEX IF NOT EXISTS "Medicine_medicineName_idx" ON "Medicine"("medicineName");

-- Add foreign key constraint
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
