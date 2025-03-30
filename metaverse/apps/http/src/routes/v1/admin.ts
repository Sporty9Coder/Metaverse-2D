import { Request, Response, Router } from "express";
import { CreateAvatarSchema, CreateElementSchema, CreateMapSchema, UpdateElementSchema } from "../../types";
import client from "@repo/db/client";
import { adminMiddleware } from "../../middleware/admin";

export const adminRouter = Router();
adminRouter.use(adminMiddleware);

adminRouter.post("/element", async (req: Request, resp: Response) => {
    const parsedData = CreateElementSchema.safeParse(req.body);

    if (!parsedData.success) {
        resp.status(400).json({ message: "Validation failed" });
        return;
    }

    try {
        const element = await client.element.create({
            data: {
                imageUrl: parsedData.data.imageUrl,
                width: parsedData.data.width,
                height: parsedData.data.height,
                static: parsedData.data.static
            }
        });

        resp.status(200).json({ id: element.id });
    } catch (error) {
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

adminRouter.put("/element/:elementId", async (req: Request, resp: Response) => {
    const parsedData = UpdateElementSchema.safeParse(req.body);

    if (!parsedData.success) {
        resp.status(400).json({ message: "Validation failed" });
        return;
    }

    try {
        const updatedElement = await client.element.update({
            where: {
                id: req.params.elementId
            },
            data: {
                imageUrl: parsedData.data.imageUrl
            }
        });

        resp.status(200).json({ message: "Element Updated Successfully", updatedElement });
    } catch (error) {
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

adminRouter.post("/avatar", async (req: Request, resp: Response) => {
    const parsedData = CreateAvatarSchema.safeParse(req.body);

    if (!parsedData.success) {
        resp.status(400).json({ message: "Validation failed" });
        return;
    }

    try {
        const avatar = await client.avatar.create({
            data: {
                imageUrl: parsedData.data.imageUrl,
                name: parsedData.data.name
            }
        });

        resp.status(200).json({ avatarId: avatar.id })
    } catch (error) {
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

adminRouter.post("/map", async (req: Request, resp: Response) => {
    const parsedData = CreateMapSchema.safeParse(req.body);

    if (!parsedData.success) {
        resp.status(400).json({ message: 'Validation failed' });
        return;
    }

    try {
        let map = await client.$transaction(async () => {
            const map = await client.map.create({
                data: {
                    thumbnail: parsedData.data.thumbnail,
                    width: parseInt(parsedData.data.dimensions.split("x")[0]),
                    height: parseInt(parsedData.data.dimensions.split("x")[1]),
                    name: parsedData.data.name,
                }
            });

            await client.mapElements.createMany({
                data: parsedData.data.defaultElements.map(elem => ({
                    mapId: map.id,
                    elementId: elem.elementId,
                    x: elem.x,
                    y: elem.y
                }))
            })

            return map;
        });

        resp.status(200).json({ id: map.id });
    } catch (error) {
        resp.status(400).json({ message: "Internal Server Error" });
    }
});
