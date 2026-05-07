import type { Server } from "node:http";
import type { Express } from "express";
import type { Logger } from "pino";

export function parsePort(rawPort: string | undefined): number {
  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  return port;
}

export function startServer(
  app: Express,
  logger: Logger,
  rawPort = process.env.PORT,
): Server {
  const port = parsePort(rawPort);
  const server = app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });

  server.on("error", (err) => {
    logger.error({ err, port }, "Error listening on port");
    process.exit(1);
  });

  return server;
}
