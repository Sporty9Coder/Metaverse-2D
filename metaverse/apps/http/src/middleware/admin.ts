import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";

export const adminMiddleware = (req: Request, resp: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.split(" ")[1];

    if (!token) {
        resp.status(403).json({ message: "Unauthorised User" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_PASSWORD) as { role: string, userId: string };

        if (decoded.role !== "Admin") {
            resp.status(403).json({ message: "Admin endpoints can't be accessed by any other user" });
            return;
        }

        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    } catch (error) {
        resp.status(403).json({ message: "Unauthorised User as token invalid" });
        return;
    }
} 