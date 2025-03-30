import express from "express";
import { router } from "./routes/v1";
// import { PrismaClient } from "@prisma/client" // this works because the @prisma/client has been rooted up to the node_modules of the root directory by turborepo

const app = express();
app.use(express.json());

app.use("/api/v1", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`);
});
