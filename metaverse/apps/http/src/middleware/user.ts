import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";
import { CustomJwtPayload } from "../types";

export const userMiddleware = (req: Request, resp: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.split(" ")[1];

    // console.log(header);
    // console.log(token);
    // const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    // console.log(`Full URL: ${fullUrl}`);

    if (!token) {
        resp.status(403).json({ message: "Unauthorised User" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_PASSWORD) as CustomJwtPayload;
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    } catch (error) {
        resp.status(403).json({ message: "Unauthorised User - Invalid token" });
        return;
    }
}