import { createServer } from "../server.ts";

const appPromise = createServer();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
