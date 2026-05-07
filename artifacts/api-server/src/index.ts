import app from "./app";
import { logger } from "./lib/logger";
import { startServer } from "./server";

startServer(app, logger);
