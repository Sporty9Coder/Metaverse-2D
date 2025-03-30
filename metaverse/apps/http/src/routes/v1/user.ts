import { Request, Response, Router } from "express";
import { UpdateMetaDataSchema } from "../../types";
import client from "@repo/db/client";
import { userMiddleware } from "../../middleware/user";

export const userRouter = Router();

userRouter.post("/metadata", userMiddleware, async (req: Request, resp: Response) => {
    const parsedData = UpdateMetaDataSchema.safeParse(req.body);

    if (!parsedData.success) {
        resp.status(400).json({ message: "Validation failed" });
        return;
    }

    try {
        const updatedUser = await client.user.update({
            where: {
                id: req.userId
            },
            data: {
                avatarId: parsedData.data.avatarId
            }
        });

        resp.status(200).json({ updatedUser: updatedUser, message: "User Meta Data Updated" });
    } catch (error) {
        // console.log(error);
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

userRouter.get("/metadata/bulk", async (req: Request, resp: Response) => {
    let userIdString = String(req.query.ids);
    if (!userIdString.startsWith('[')) {
        userIdString = '[' + userIdString; // Add opening bracket if missing
    }

    if (!userIdString.endsWith(']')) {
        userIdString = userIdString + ']'; // Add closing bracket if missing
    }

    // console.log(userIdString);

    const userIds = userIdString.slice(1, userIdString.length - 1).split(",");
    // console.log(userIds);

    try {
        const metadata = await client.user.findMany({
            where: {
                id: {
                    in: userIds
                }
            },
            select: {
                avatar: true,
                id: true
            }
        });

        resp.json({
            avatars: metadata.map(user => ({
                userId: user.id,
                imageUrl: user.avatar?.imageUrl
            }))
        });
    } catch (error) {
        // console.log(error);
        resp.status(400).json({ message: "Internal Server Error" });
    }
});