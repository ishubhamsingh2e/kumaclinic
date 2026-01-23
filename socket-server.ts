import { Server } from "socket.io";
import { createServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Redis setup for pub/sub
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
let pubClient: Redis;
let subClient: Redis;

async function setupRedis() {
  try {
    pubClient = new Redis(REDIS_URL);
    subClient = new Redis(REDIS_URL);

    io.adapter(createAdapter(pubClient, subClient));
    console.log("✓ Redis adapter connected");
  } catch (error) {
    console.warn("⚠ Redis not available, using in-memory adapter:", error);
  }
}

// Subscribe to log events from Redis
async function subscribeToLogEvents() {
  if (!subClient) {
    console.warn("⚠ subClient not available, skipping Redis subscription");
    return;
  }

  try {
    await subClient.subscribe("system:logs", (err) => {
      if (err) {
        console.error("Failed to subscribe:", err);
        return;
      }
      console.log("✓ Subscribed to system:logs channel");
    });

    subClient.on("message", (channel, message) => {
      if (channel === "system:logs") {
        try {
          const log = JSON.parse(message);
          console.log("📨 Broadcasting log to logs room:", log.id);
          // Broadcast to all connected admin clients
          io.to("logs").emit("new-log", log);
        } catch (err) {
          console.error("Failed to parse log message:", err);
        }
      }
    });
  } catch (error) {
    console.warn("Failed to subscribe to logs:", error);
  }
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  // Join logs room for real-time log streaming
  socket.on("join-logs", () => {
    socket.join("logs");
    console.log(`Socket ${socket.id} joined logs room`);
  });

  // Leave logs room
  socket.on("leave-logs", () => {
    socket.leave("logs");
    console.log(`Socket ${socket.id} left logs room`);
  });

  // Handle internal emission from server actions
  socket.on(
    "send-notification",
    (data: { userId: string; notification: Notification }) => {
      io.to(data.userId).emit("new-notification", data.notification);
      console.log(`Notification sent to user ${data.userId}`);
    },
  );

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;

// Start server with Redis setup
async function startServer() {
  await setupRedis();
  await subscribeToLogEvents();

  httpServer.listen(PORT, () => {
    console.log(`✓ WebSocket server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  if (pubClient) await pubClient.quit();
  if (subClient) await subClient.quit();
  process.exit(0);
});
