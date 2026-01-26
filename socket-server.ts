import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { getToken } from "next-auth/jwt";
import { prisma } from "./lib/db";
import { logger } from "./lib/logger";

// 1. Centralized Configuration
const config = {
  corsOrigin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  port: process.env.SOCKET_PORT || 3001,
  nextAuthSecret: process.env.AUTH_SECRET,
};

if (!config.nextAuthSecret) {
  throw new Error("AUTH_SECRET is not set");
}

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let pubClient: Redis;
let subClient: Redis;

async function setupRedis() {
  try {
    pubClient = new Redis(config.redisUrl);
    subClient = pubClient.duplicate();

    pubClient.on("error", (err) =>
      logger.error("Redis Pub Client Error", { error: err, publish: false }),
    );
    subClient.on("error", (err) =>
      logger.error("Redis Sub Client Error", { error: err, publish: false }),
    );

    // No need for explicit .connect() in ioredis v5
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Redis adapter connected", { publish: false });
  } catch (error) {
    logger.warn("Redis not available, using in-memory adapter", {
      error,
      publish: false,
    });
  }
}

// 2. Decode JWT from NextAuth
async function decodeAuthToken(socket: Socket) {
  const token = socket.handshake.auth.token;
  if (!token) return null;

  // The 'req' object is mocked to satisfy next-auth's getToken function
  return getToken({
    req: {
      headers: {
        cookie: `next-auth.session-token=${token}`,
      },
    } as any,
    secret: config.nextAuthSecret,
  });
}

// 3. Authentication Middleware
io.use(async (socket, next) => {
  const decodedToken = await decodeAuthToken(socket);
  if (decodedToken) {
    (socket as any).user = decodedToken;
    return next();
  }
  logger.warn(`Unauthorized connection attempt from ${socket.id}`, {
    publish: false,
  });
  return next(new Error("Authentication error"));
});

// 4. Permission Check Function
async function hasAdminRole(user: any): Promise<boolean> {
  if (!user?.id || !user?.activeClinicId) {
    return false;
  }

  try {
    const membership = await prisma.clinicMember.findUnique({
      where: {
        userId_clinicId: {
          userId: user.id,
          clinicId: user.activeClinicId,
        },
      },
      include: {
        Role: true,
      },
    });

    // Check if role name is 'ADMIN'
    return membership?.Role?.name === "ADMIN";
  } catch (error) {
    logger.error("Permission check error", { error, publish: false });
    return false;
  }
}

async function subscribeToEvents() {
  if (!subClient) {
    logger.warn("subClient not available, skipping Redis subscriptions", {
      publish: false,
    });
    return;
  }

  subClient.on("message", (channel, message) => {
    try {
      const data = JSON.parse(message);
      if (channel === "system:logs") {
        logger.info(`Broadcasting log to logs room: ${data.id}`, {
          publish: false,
        });
        io.to("logs").emit("new-log", data);
      }
      if (channel === "user:notifications") {
        const { userId, notification } = data;
        logger.info(`Sending notification to user ${userId}`, {
          publish: false,
        });
        io.to(userId).emit("new-notification", notification);
      }
    } catch (err) {
      logger.error(`Failed to parse message from channel ${channel}`, {
        error: err,
        publish: false,
      });
    }
  });

  try {
    await subClient.subscribe("system:logs", "user:notifications");
    logger.info("Subscribed to system:logs and user:notifications channels", {
      publish: false,
    });
  } catch (err) {
    logger.error("Failed to subscribe to Redis channels", {
      error: err,
      publish: false,
    });
  }
}

io.on("connection", (socket) => {
  const user = (socket as any).user;
  logger.info(`Socket connected: ${socket.id}, User: ${user.id}`, {
    publish: false,
  });

  socket.join(user.id);

  // 5. Secured 'join-logs' event
  socket.on("join-logs", async () => {
    const isAdmin = await hasAdminRole(user);
    if (isAdmin) {
      socket.join("logs");
      logger.info(`Admin user ${user.id} joined logs room`, {
        publish: false,
      });
    } else {
      logger.warn(
        `User ${user.id} attempted to join logs room without permission`,
        { publish: false },
      );
    }
  });

  socket.on("leave-logs", () => {
    logger.info(`User ${user.id} left logs room`, { publish: false });
    socket.leave("logs");
  });

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}, User: ${user.id}`, {
      publish: false,
    });
  });
});

async function startServer() {
  await setupRedis();
  await subscribeToEvents();

  httpServer.listen(config.port, () => {
    logger.info(`WebSocket server running on port ${config.port}`, {
      publish: false,
    });
  });
}

startServer().catch((err) => {
  logger.error("Failed to start server", { error: err, publish: false });
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  io.close(() => {
    (async () => {
      if (pubClient) await pubClient.quit();
      if (subClient) await subClient.quit();
      process.exit(0);
    })();
  });
});
