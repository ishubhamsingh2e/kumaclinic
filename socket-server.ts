import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, replace with your actual origin
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  // Handle internal emission from server actions
  socket.on("send-notification", (data: { userId: string, notification: any }) => {
    io.to(data.userId).emit("new-notification", data.notification);
    console.log(`Notification sent to user ${data.userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});
