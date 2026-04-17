import { Router } from "express";

const router = Router();

const rooms = [];

router.get("/", (req, res) => {
  res.json(rooms);
});

router.post("/", (req, res) => {
  const room = {
    id: crypto.randomUUID(),
    name: req.body.name,
    createdAt: new Date(),
  };

  rooms.push(room);

  res.status(201).json(room);
});

export default router;