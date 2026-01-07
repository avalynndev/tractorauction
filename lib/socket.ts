import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as SocketServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer) {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Join auction room
      socket.on("join-auction", (auctionId: string) => {
        socket.join(`auction-${auctionId}`);
        console.log(`Socket ${socket.id} joined auction ${auctionId}`);
      });

      // Leave auction room
      socket.on("leave-auction", (auctionId: string) => {
        socket.leave(`auction-${auctionId}`);
        console.log(`Socket ${socket.id} left auction ${auctionId}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }
  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

// Helper function to emit to an auction room
export function emitToAuction(auctionId: string, event: string, data: any) {
  if (io) {
    io.to(`auction-${auctionId}`).emit(event, data);
  }
}





























