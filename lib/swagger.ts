import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Tractor Auction API",
      version: "1.0.0",
      description: "API documentation for Tractor Auction platform - Buy & Sell Used Tractors",
      contact: {
        name: "API Support",
        email: "support@tractorauction.in",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://www.tractorauction.in",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            fullName: { type: "string" },
            phoneNumber: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["BUYER", "SELLER", "ADMIN"] },
            isActive: { type: "boolean" },
          },
        },
        Vehicle: {
          type: "object",
          properties: {
            id: { type: "string" },
            vehicleType: { type: "string" },
            saleType: { type: "string", enum: ["AUCTION", "PREAPPROVED"] },
            saleAmount: { type: "number" },
            tractorBrand: { type: "string" },
            tractorModel: { type: "string" },
            engineHP: { type: "string" },
            yearOfMfg: { type: "integer" },
            state: { type: "string" },
            district: { type: "string" },
            status: { type: "string" },
          },
        },
        Auction: {
          type: "object",
          properties: {
            id: { type: "string" },
            vehicleId: { type: "string" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            currentBid: { type: "number" },
            reservePrice: { type: "number" },
            status: { type: "string" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            vehicleId: { type: "string", nullable: true },
            auctionId: { type: "string", nullable: true },
            isRead: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and registration endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Vehicles",
        description: "Vehicle listing and management endpoints",
      },
      {
        name: "Auctions",
        description: "Auction management endpoints",
      },
      {
        name: "Bids",
        description: "Bidding endpoints",
      },
      {
        name: "Watchlist",
        description: "Watchlist management endpoints",
      },
      {
        name: "Notifications",
        description: "Notification management endpoints",
      },
      {
        name: "Inspections",
        description: "Vehicle inspection endpoints",
      },
      {
        name: "Admin",
        description: "Admin-only endpoints",
      },
    ],
  },
  apis: [
    "./app/api/**/*.ts", // Path to the API files
  ],
};

export const swaggerSpec = swaggerJsdoc(options);


