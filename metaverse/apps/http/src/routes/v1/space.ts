import { Request, Response, Router } from "express";
import { userMiddleware } from "../../middleware/user";
import { AddElementSchema, CreateSpaceSchema, DeleteElementSchema } from "../../types";
import client from "@repo/db/client";

export const spaceRouter = Router();
spaceRouter.use(userMiddleware);

spaceRouter.post("/", async (req: Request, resp: Response) => {
    const parsedData = CreateSpaceSchema.safeParse(req.body);

    if (!parsedData.success) {
        // console.log(parsedData.error);
        resp.status(400).json({ message: "Validation failed" });
        return;
    }

    if (!parsedData.data.mapId) {
        try {
            const space = await client.space.create({
                data: {
                    name: parsedData.data.name,
                    width: parseInt(parsedData.data.dimensions.split("x")[0]),
                    height: parseInt(parsedData.data.dimensions.split("x")[1]),
                    creatorId: req.userId!
                }
            });

            resp.status(200).json({ spaceId: space.id });
            return;
        } catch (error) {
            resp.status(400).json({ message: "Internal Server Error" });
        }
    }

    try {
        const map = await client.map.findUnique({
            where: {
                id: parsedData.data.mapId!
            },
            select: {
                mapElements: true,
                width: true,
                height: true
            }
        });

        if (!map) {
            resp.status(400).json({ message: "Map not found" });
            return;
        }

        let space = await client.$transaction(async () => {
            const space = await client.space.create({
                data: {
                    name: parsedData.data.name,
                    width: map.width,
                    height: map.height,
                    creatorId: req.userId!,
                }
            });

            await client.spaceElements.createMany({
                data: map.mapElements.map(elem => ({
                    spaceId: space.id,
                    elementId: elem.elementId,
                    x: elem.x,
                    y: elem.y
                }))
            });

            return space;
        });

        resp.status(200).json({ spaceId: space.id });
    } catch (error) {
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

spaceRouter.delete("/element", async (req: Request, resp: Response) => {
    const parsedData = DeleteElementSchema.safeParse(req.body);

    if (!parsedData.success) {
        resp.status(400).json({ message: "Validation failed" });
        return;
    }

    try {
        const spaceElement = await client.spaceElements.findFirst({
            where: {
                id: parsedData.data.id
            },
            select: {
                space: {
                    select: {
                        creatorId: true
                    }
                }
            }
        });

        if (!spaceElement?.space.creatorId || spaceElement.space.creatorId !== req.userId) {
            resp.status(403).json({ message: "You are not the creator of this space" });
            return;
        }

        await client.spaceElements.delete({
            where: {
                id: parsedData.data.id
            }
        });

        resp.status(200).json({ message: "Element Deleted successfully from your space" });
    } catch (error) {
        // console.log(error);
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

spaceRouter.delete("/:spaceId", async (req: Request, resp: Response) => {
    try {
        const space = await client.space.findUnique({
            where: {
                id: req.params.spaceId
            },
            select: {
                creatorId: true
            }
        });

        if (!space) {
            resp.status(400).json({ message: "Space Not found" });
            return;
        }

        if (space.creatorId !== req.userId) {
            resp.status(403).json({ message: "Unauthorised User" });
            return;
        }

        await client.spaceElements.deleteMany({
            where: {
                spaceId: req.params.spaceId
            }
        });

        await client.space.delete({
            where: {
                id: req.params.spaceId
            }
        });

        resp.status(200).json({ message: "Space Deleted Successfully" });
    } catch (error) {
        // console.log("error in deleting space api");
        // console.log(error);
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

spaceRouter.get("/all", async (req: Request, resp: Response) => {
    try {
        // console.log("fetching all spaces created by a user");
        // console.log(req.role);
        // console.log(req.userId);
        const allSpaces = await client.space.findMany({
            where: {
                creatorId: req.userId
            },
            select: {
                id: true,
                name: true,
                width: true,
                height: true,
                thumbnail: true
            }
        });

        // console.log("all spaces", allSpaces);

        resp.status(200).json({
            spaces: allSpaces.map(space => ({
                id: space.id,
                name: space.name,
                dimensions: `${space.width}x${space.height}`,
                thumbnail: space.thumbnail
            }))
        });
    } catch (error) {
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

spaceRouter.get("/:spaceId", async (req: Request, resp: Response) => {
    try {
        const space = await client.space.findUnique({
            where: {
                id: req.params.spaceId
            },
            select: {
                width: true,
                height: true
            }
        });

        if (!space) {
            resp.status(400).json({ message: "Space not found" });
            return;
        }

        const elements = await client.spaceElements.findMany({
            where: {
                spaceId: req.params.spaceId
            },
            select: {
                id: true,
                element: true,
                x: true,
                y: true
            }
        });

        // console.log("space elements", elements);

        resp.status(200).json({
            dimensions: `${space.width}x${space.height}`,
            elements
        });
    } catch (error) {
        resp.status(400).json({ message: "Internal Server Error" });
    }
});

spaceRouter.post("/element", async (req: Request, resp: Response) => {
    const parsedData = AddElementSchema.safeParse(req.body);

    if (!parsedData.success) {
        resp.status(400).json({ message: "Validation failed" });
        return;
    }

    try {
        const space = await client.space.findUnique({
            where: {
                id: parsedData.data.spaceId,
                creatorId: req.userId
            },
            select: {
                width: true,
                height: true
            }
        });

        if (!space) {
            resp.status(400).json({ message: "Space not found" });
            return;
        }

        // check new element is being added at a point inside the space boundary or not.
        if (parsedData.data.x < 0 || parsedData.data.y < 0 || parsedData.data.x > space.width || parsedData.data.y > space.height) {
            resp.status(400).json({ message: "Element cannot be added outside the space dimensions" });
            return;
        }

        await client.spaceElements.create({
            data: {
                elementId: parsedData.data.elementId,
                spaceId: parsedData.data.spaceId,
                x: parsedData.data.x,
                y: parsedData.data.y
            }
        })

        resp.status(200).json({ message: "Element added to space successfully" });
    } catch (error) {
        resp.status(400).json({ message: "Internal Server Error" });
    }
});



