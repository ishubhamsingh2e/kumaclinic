-- Create MedicineGroup table
CREATE TABLE IF NOT EXISTS "MedicineGroup" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineGroup_pkey" PRIMARY KEY ("id")
);

-- Create MedicineGroupItem junction table
CREATE TABLE IF NOT EXISTS "MedicineGroupItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicineGroupItem_pkey" PRIMARY KEY ("id")
);

-- Create indexes for MedicineGroup
CREATE INDEX IF NOT EXISTS "MedicineGroup_doctorId_idx" ON "MedicineGroup"("doctorId");

-- Create indexes for MedicineGroupItem
CREATE UNIQUE INDEX IF NOT EXISTS "MedicineGroupItem_groupId_medicineId_key" ON "MedicineGroupItem"("groupId", "medicineId");
CREATE INDEX IF NOT EXISTS "MedicineGroupItem_groupId_idx" ON "MedicineGroupItem"("groupId");
CREATE INDEX IF NOT EXISTS "MedicineGroupItem_medicineId_idx" ON "MedicineGroupItem"("medicineId");

-- Add foreign key constraints
ALTER TABLE "MedicineGroup" ADD CONSTRAINT "MedicineGroup_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicineGroupItem" ADD CONSTRAINT "MedicineGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MedicineGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicineGroupItem" ADD CONSTRAINT "MedicineGroupItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
