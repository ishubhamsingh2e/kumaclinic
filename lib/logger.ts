import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { prisma } from "@/lib/db";
import { LogLevel, LogType } from "@prisma/client";
import Redis from "ioredis";

// Define log directories
const logDir = process.env.LOG_DIR || "logs";

// Redis client for pub/sub
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
let redisClient: Redis | null = null;

// Initialize Redis connection
async function getRedisClient() {
  if (redisClient?.status === "ready") return redisClient;

  try {
    redisClient = new Redis(REDIS_URL);
    console.log("✓ Logger Redis client connected");
    return redisClient;
  } catch (error) {
    console.warn("⚠ Redis not available for logging:", error);
    return null;
  }
}

// Publish log to Redis for real-time streaming
async function publishLog(log: any) {
  try {
    const client = await getRedisClient();
    if (client?.status === "ready") {
      await client.publish("system:logs", JSON.stringify(log));
      console.log("📤 Published log to Redis:", log.id);
    } else {
      console.log("⚠ Redis not ready, skipping publish. Status:", client?.status);
    }
  } catch (error) {
    // Silently fail - real-time streaming is not critical
    console.debug("Failed to publish log to Redis:", error);
  }
}

// Create Winston logger with file rotation
export const fileLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Rotate error logs daily
    new DailyRotateFile({
      filename: `${logDir}/error-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "30d", // Keep 30 days of error logs
      zippedArchive: true,
    }),
    // Rotate combined logs daily
    new DailyRotateFile({
      filename: `${logDir}/combined-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d", // Keep 14 days of combined logs
      zippedArchive: true,
    }),
    // Console logging in development
    ...(process.env.NODE_ENV !== "production"
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
        ]
      : []),
  ],
});

// Database logging service
class Logger {
  private async writeToDb(data: {
    level: LogLevel;
    type: LogType;
    message: string;
    metadata?: any;
    userId?: string;
    ip?: string;
    userAgent?: string;
    path?: string;
    method?: string;
    statusCode?: number;
    duration?: number;
  }) {
    try {
      const log = await prisma.log.create({
        data: {
          ...data,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Publish to Redis for real-time streaming (non-blocking)
      publishLog(log).catch(() => {
        // Ignore errors in pub/sub
      });

      return log;
    } catch (error) {
      // If DB logging fails, log to file
      fileLogger.error("Failed to write log to database", { error, originalLog: data });
    }
  }

  async error(message: string, metadata?: any) {
    fileLogger.error(message, metadata);
    await this.writeToDb({
      level: "ERROR",
      type: "ERROR",
      message,
      metadata,
    });
  }

  async warn(message: string, metadata?: any) {
    fileLogger.warn(message, metadata);
    await this.writeToDb({
      level: "WARN",
      type: "SYSTEM",
      message,
      metadata,
    });
  }

  async info(message: string, metadata?: any) {
    fileLogger.info(message, metadata);
    await this.writeToDb({
      level: "INFO",
      type: "SYSTEM",
      message,
      metadata,
    });
  }

  async debug(message: string, metadata?: any) {
    fileLogger.debug(message, metadata);
    await this.writeToDb({
      level: "DEBUG",
      type: "SYSTEM",
      message,
      metadata,
    });
  }

  // Specialized logging methods
  async logAccess(data: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    path: string;
    method: string;
    statusCode: number;
    duration: number;
  }) {
    fileLogger.info("Access log", data);
    await this.writeToDb({
      level: "INFO",
      type: "ACCESS",
      message: `${data.method} ${data.path} - ${data.statusCode}`,
      ...data,
    });
  }

  async logAudit(message: string, userId: string, metadata?: any) {
    fileLogger.info("Audit log", { message, userId, ...metadata });
    await this.writeToDb({
      level: "INFO",
      type: "AUDIT",
      message,
      userId,
      metadata,
    });
  }

  async logAuth(message: string, userId?: string, metadata?: any) {
    fileLogger.info("Auth log", { message, userId, ...metadata });
    await this.writeToDb({
      level: "INFO",
      type: "AUTH",
      message,
      userId,
      metadata,
    });
  }

  async logEmail(message: string, metadata?: any) {
    fileLogger.info("Email log", { message, ...metadata });
    await this.writeToDb({
      level: "INFO",
      type: "EMAIL",
      message,
      metadata,
    });
  }
}

export const logger = new Logger();

// Cleanup old logs from database (run this periodically)
export async function cleanupOldLogs(days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  try {
    const result = await prisma.log.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    fileLogger.info(`Cleaned up ${result.count} old log entries`);
    return result.count;
  } catch (error) {
    fileLogger.error("Failed to cleanup old logs", { error });
    throw error;
  }
}
