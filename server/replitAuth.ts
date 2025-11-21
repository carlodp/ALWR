import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Middleware to load user from session
export async function loadUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Replit Auth stores the user ID in the session
    const userId = (req as any).session?.userId;
    
    if (userId) {
      const user = await storage.getUser(userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    console.error("Error loading user:", error);
    next();
  }
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - Authentication required" });
  }
  next();
}

// Middleware to require specific role
export function requireRole(role: 'customer' | 'admin' | 'agent') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized - Authentication required" });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ message: `Forbidden - ${role} role required` });
    }
    
    next();
  };
}

// Middleware to require admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - Authentication required" });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  next();
}
