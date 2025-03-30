import z from "zod";

export const SignupSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(8),
    type: z.enum(["admin", "user"]),
});

export const SigninSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(8),
});

export const UpdateMetaDataSchema = z.object({
    avatarId: z.string()
});

export const CreateSpaceSchema = z.object({
    name: z.string(),
    dimensions: z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
    mapId: z.string().optional().nullable()
});

export const AddElementSchema = z.object({
    elementId: z.string(),
    spaceId: z.string(),
    x: z.number(),
    y: z.number()
});

export const DeleteElementSchema = z.object({
    id: z.string()
})

export const CreateElementSchema = z.object({
    imageUrl: z.string(),
    width: z.number(),
    height: z.number(),
    static: z.boolean()
});

export const UpdateElementSchema = z.object({
    imageUrl: z.string(),
});

export const CreateAvatarSchema = z.object({
    name: z.string(),
    imageUrl: z.string()
});

export const CreateMapSchema = z.object({
    name: z.string(),
    thumbnail: z.string(),
    dimensions: z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
    defaultElements: z.array(z.object({
        elementId: z.string(),
        x: z.number(),
        y: z.number()
    }))
});

declare global {
    namespace Express {
        export interface Request {
            role: "Admin" | "User";
            userId: string;
        }
    }
}

export interface CustomJwtPayload {
    role: "Admin" | "User";
    userId: string;
}