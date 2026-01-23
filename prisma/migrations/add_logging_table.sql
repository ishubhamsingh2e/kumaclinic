-- Create Log enums and table
CREATE TYPE "LogLevel" AS ENUM ('ERROR', 'WARN', 'INFO', 'DEBUG');
CREATE TYPE "LogType" AS ENUM ('ACCESS', 'ERROR', 'AUDIT', 'SYSTEM', 'EMAIL', 'AUTH');

-- Create Log table
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "type" "LogType" NOT NULL DEFAULT 'SYSTEM',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "path" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "Log_level_type_createdAt_idx" ON "Log"("level", "type", "createdAt");
CREATE INDEX "Log_userId_idx" ON "Log"("userId");
CREATE INDEX "Log_createdAt_idx" ON "Log"("createdAt");

-- Add foreign key
ALTER TABLE "Log" ADD CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
