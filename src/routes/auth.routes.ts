import { Router } from "express";

const authRoutes = Router();

/**
 * Exemplo de rota
 */
authRoutes.post("/login", (req, res) => {
  return res.json({ message: "Login route working" });
});

authRoutes.post("/register", (req, res) => {
  return res.json({ message: "Register route working" });
});

export default authRoutes;
