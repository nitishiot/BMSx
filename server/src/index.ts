import "dotenv/config";
import cors from "cors";
import express from "express";
import boardersRouter from "./routes/boarders";
import dashboardRouter from "./routes/dashboard";
import paymentsRouter from "./routes/payments";
import roomsRouter from "./routes/rooms";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/rooms", roomsRouter);
app.use("/api/boarders", boardersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`BMSx API listening on http://localhost:${port}`);
});
