import { WebSocket } from "ws"
import { RoomManager } from "./RoomManager";
import { OutgoingMessage } from "./types";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";

const client = new PrismaClient();

function getRandomString(length: number): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890!@#$&";

    let result = "";

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
}

export class User {
    public id: string;
    private ws: WebSocket;
    private userId?: string;
    private spaceId?: string;
    private x: number;
    private y: number;

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.x = 0;
        this.y = 0;
        this.id = getRandomString(10);
        this.initHandlers();
    }

    initHandlers() {
        this.ws.on("message", async (data) => {
            const parsedData = JSON.parse(data.toString());

            switch (parsedData.type) {
                case "join":
                    const token = parsedData.payload.token;
                    const spaceId = parsedData.payload.spaceId;

                    const userId = (jwt.verify(token, JWT_PASSWORD) as JwtPayload).userId;

                    if (!userId) {
                        this.ws.close();
                        return;
                    }
                    this.userId = userId;

                    const space = await client.space.findUnique({
                        where: {
                            id: spaceId
                        }
                    })

                    if (!space) {
                        this.ws.close();
                        return;
                    }
                    this.spaceId = spaceId;

                    RoomManager.getInstance().addUser(spaceId, this);

                    this.x = Math.floor(Math.random() * space.width);
                    this.y = Math.floor(Math.random() * space.height);

                    this.sendMessage(JSON.stringify({
                        type: "space-joined",
                        payload: {
                            spawn: {
                                x: this.x,
                                y: this.y
                            },
                            users: RoomManager.getInstance().rooms.get(spaceId)?.filter(user => user.id !== this.id).map(user => ({id: user.id}))
                        }
                    }));

                    RoomManager.getInstance().broadcast(JSON.stringify({
                        type: "user-join",
                        payload: {
                            userId: this.userId,
                            x: this.x,
                            y: this.y
                        }
                    }), this, this.spaceId!)
                    break;
                case "move":
                    const moveX = parsedData.payload.x;
                    const moveY = parsedData.payload.y;

                    const xDisplacement = Math.abs(moveX - this.x);
                    const yDisplacement = Math.abs(moveY - this.y);

                    if (xDisplacement == 1 && yDisplacement == 0 || xDisplacement == 0 && yDisplacement == 1) {
                        this.x = moveX;
                        this.y = moveY;

                        RoomManager.getInstance().broadcast(JSON.stringify({
                            type: "movement",
                            payload: {
                                x: this.x,
                                y: this.y,
                                userId: this.userId
                            }
                        }), this, this.spaceId!);
                        return;
                    }

                    this.sendMessage(JSON.stringify({
                        type: "movement-rejected",
                        payload: {
                            x: this.x,
                            y: this.y
                        }
                    }));
                    break;
                default:
                    break;
            }
        })
    }

    public destroy() {
        RoomManager.getInstance().broadcast(JSON.stringify({
            type: "user-left",
            payload: {
                userId: this.userId
            }
        }), this, this.spaceId!)

        RoomManager.getInstance().removeUser(this, this.spaceId!);
    }

    public sendMessage(message: OutgoingMessage) {
        this.ws.send(message);
    }
}