import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});
console.log("CAMINHO ENV:", path.resolve(__dirname, "../.env"));
console.log("EMAIL_USER TESTE:", process.env.EMAIL_USER);
import express from "express";
import os from "os";

import { initDB } from "./db";
import authRoutes from "./routes/auth.routes";
import { env } from "./config/env";
import pdfRoutes from "./routes/pdf.routes";
import aiRoutes from "./routes/ai.routes";
import forgotPasswordRoutes from "./routes/forgotPassword.routes";

const app = express();

app.use(express.json());

initDB();

/* ROTAS */
app.use("/auth", authRoutes);
app.use("/auth", forgotPasswordRoutes);

app.use("/users", authRoutes);

app.use("/pdf", pdfRoutes);
app.use("/ai", aiRoutes);

console.log("✅ Rotas de recuperação carregadas");

/* TESTE */
app.get("/", (req, res) => {
  res.send("Backend funcionando 🚀");
});

/* PEGA IP LOCAL */
function getLocalIPv4() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return "localhost";
}

const localIP = getLocalIPv4();

/* START SERVER */
app.listen(env.port, "0.0.0.0", () => {
  console.log(`🔥 Server running locally: http://localhost:${env.port}`);
  console.log(`🌐 Server running on network: http://${localIP}:${env.port}`);

  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS existe:", !!process.env.EMAIL_PASS);
});