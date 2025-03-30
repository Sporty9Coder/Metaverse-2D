import { OutgoingMessage } from "./types";
import { User } from "./User";

export class RoomManager {
    rooms: Map<string, User[]>;
    private static instance: RoomManager;

    private constructor() {
        this.rooms = new Map();
    }

    static getInstance(): RoomManager {
        if (!this.instance) {
            this.instance = new RoomManager();
        }

        return this.instance;
    }

    public addUser(spaceId: string, user: User) {
        if (!this.rooms.has(spaceId)) {
            this.rooms.set(spaceId, [user]);
            return;
        }

        this.rooms.set(spaceId, [...(this.rooms.get(spaceId) ?? []), user]);
    }
    
    public removeUser(user: User, spaceId: string) {
        if(!this.rooms.has(spaceId))
        {
            return;
        }

        this.rooms.set(spaceId, (this.rooms.get(spaceId)?.filter(u => u.id !== user.id)) ?? []);
    }

    public broadcast(message: OutgoingMessage, user: User, roomId: string) {
        if(!this.rooms.get(roomId))
        {
            return;
        }

        this.rooms.get(roomId)?.forEach(u => {
            if(u.id !== user.id)
            {
                u.sendMessage(message);
            }
        });
    }
}