import express from "express";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";
import openApi from "./docs/setup.js";
import mongoClient from "./functions/mongodb.js"

import { getAccessToken } from "./middleware/token.js";
import { getUserUUID } from "./middleware/user.js";
import { defaultError, invalidEndpoint } from "./handlers/default.js";

import { defineLogLevel } from "./functions/logger.js";

import authRouter from "./routes/auth.js";
import productRouter from "./routes/product.js";
import categoryRouter from "./routes/category.js";

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const keysDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "keys",
);

process.env.PRIVATE_KEY = fs.readFileSync(path.join(keysDir, "private.pem"));
process.env.PUBLIC_KEY = fs.readFileSync(path.join(keysDir, "public.pem"));

const app = express();
app.use(cookieParser());

defineLogLevel(app, process.env.NODE_ENV);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApi));

app.use(express.json());

app.use("/auth", authRouter);
app.use("/product", getAccessToken, getUserUUID, productRouter);
app.use("/category", getAccessToken, getUserUUID, categoryRouter);
app.use(defaultError);
app.use("*", invalidEndpoint);

if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`API OK`);
  });
}

export default app;
