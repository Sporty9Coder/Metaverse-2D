import { Request, Response, Router } from "express";
import { userRouter } from "./user";
import { spaceRouter } from "./space";
import { adminRouter } from "./admin";
import { SigninSchema, SignupSchema } from "../../types";
import client from "@repo/db/client";
import jwt from "jsonwebtoken"
import { JWT_PASSWORD } from "../../config";
import { hash, compare } from "../../scrypt";

export const router = Router();

router.post("/signup", async (req, resp) => {
    // check the user signing up.
    const parsedData = SignupSchema.safeParse(req.body);

    if (!parsedData.success) {
        // console.log(parsedData.error);
        resp.status(400).json({ message: "Validation failed" });
        return;
    }

    try {
        const hashedPassword = await hash(parsedData.data.password)
        const user = await client.user.create({
            data: {
                username: parsedData.data.username,
                password: hashedPassword,
                role: parsedData.data.type === "admin" ? "Admin" : "User"
            }
        });

        resp.status(200).json({ userId: user.id });

    } catch (error) {
        // console.log(error);
        resp.status(400).json({ message: "User already exists" });
    }
});

router.post("/signin", async (req, resp) => {
    // check the user signing in.
    const parsedData = SigninSchema.safeParse(req.body);

    if (!parsedData.success) {
        // console.log(parsedData.error);
        resp.status(400).json({ message: "Validation failed" });
        return;
    }

    try {
        const user = await client.user.findUnique({
            where: {
                username: parsedData.data.username
            }
        });

        if (!user) {
            resp.status(403).json({ message: "User not found" });
            return;
        }

        const isValid = await compare(parsedData.data.password, user.password);

        if (!isValid) {
            resp.status(403).json({ message: "Invalid password" });
            return;
        }
        
        // console.log("user username", user.username);
        // console.log("userId", user.id);
        // console.log("user role", user.role);

        const token = jwt.sign({
            userId: user.id,
            role: user.role
        }, JWT_PASSWORD);

        resp.status(200).json({ token })
    } catch (error) {
        // console.log(error);
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

router.get("/avatars", async (req: Request, resp: Response) => {
    try {
        const avatars = await client.avatar.findMany();
        // console.log(avatars);
        resp.status(200).json({ avatars })
    } catch (error) {
        // console.log(error);
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

router.get("/elements", async (req: Request, resp: Response) => {
    try {
        const elements = await client.element.findMany();
        resp.status(200).json({ elements });
    } catch (error) {
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

router.use("/user", userRouter);
router.use("/space", spaceRouter);
router.use("/admin", adminRouter);

