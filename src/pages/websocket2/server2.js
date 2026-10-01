import cors from "cors";
import express from "express";
import http from "node:http";
import pg from "pg";
import { WebSocketServer } from "ws";
import { registerAuthRoutes, requireAuth } from "../../auth/serverAuth.js";

const { Pool } = pg;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3001;

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "chatapp",
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "010902",
});

app.use(cors());
app.use(express.json());

// Helpers
const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const sendJson = (ws, data) => ws.send(JSON.stringify(data));

const broadcastToRoom = (roomId, data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.roomId === roomId) {
      sendJson(client, data);
    }
  });
};

// Auth
registerAuthRoutes(app, pool);

// Rooms
app.get("/api/rooms", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.room_id, r.room_name,
             COUNT(rm.room_member_id)::int AS member_count
      FROM room r
      LEFT JOIN room_member rm ON rm.room_id = r.room_id
      GROUP BY r.room_id, r.room_name
      ORDER BY r.room_id
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get rooms" });
  }
});

// Users
app.get("/api/users", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT user_id, name, username, avatar
      FROM users
      ORDER BY user_id
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

// Room members
app.get("/api/rooms/:roomId/members", requireAuth, async (req, res) => {
  const roomId = parseId(req.params.roomId);

  if (!roomId) return res.status(400).json({ error: "Invalid roomId" });

  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM room_member
       WHERE room_id = $1
       ORDER BY joined_at`,
      [roomId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get members" });
  }
});

// Messages
app.get("/api/rooms/:roomId/messages", requireAuth, async (req, res) => {
  const roomId = parseId(req.params.roomId);
  const userId = parseId(req.auth.userId);

  if (!roomId || !userId) {
    return res.status(400).json({ error: "Invalid roomId or userId" });
  }

  try {
    const membership = await pool.query(
      `SELECT 1 FROM room_member WHERE room_id = $1 AND user_id = $2`,
      [roomId, userId]
    );

    if (!membership.rowCount) {
      return res.status(403).json({
        error: "Join this room before viewing its messages",
      });
    }

    const [messages, members] = await Promise.all([
      pool.query(
        `SELECT m.message_id, m.room, m.message, m.time_send,
                u.user_id, u.name, u.username, u.avatar
         FROM messages m
         JOIN users u ON u.user_id = m.user_id
         WHERE m.room = $1
         ORDER BY m.time_send, m.message_id`,
        [roomId]
      ),
      pool.query(
        `SELECT u.user_id, u.name, u.username, u.avatar
         FROM users u
         JOIN room_member rm ON u.user_id = rm.user_id
         WHERE rm.room_id = $1
         ORDER BY u.user_id`,
        [roomId]
      ),
    ]);

    res.json({
      messages: messages.rows,
      members: members.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get room conversation" });
  }
});

// Join room
app.post("/api/rooms/:roomId/members", requireAuth, async (req, res) => {
  const roomId = parseId(req.params.roomId);
  const userId = parseId(req.auth.userId);

  if (!roomId || !userId) {
    return res.status(400).json({ error: "Invalid roomId or userId" });
  }

  try {
    const { rows } = await pool.query(
      `WITH inserted AS (
         INSERT INTO room_member (room_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (room_id, user_id) DO NOTHING
         RETURNING room_member_id, room_id, user_id
       )
       SELECT i.*, u.name, u.username, u.avatar
       FROM inserted i
       JOIN users u ON u.user_id = i.user_id`,
      [roomId, userId]
    );

    const member = rows[0];

    if (member) {
      broadcastToRoom(roomId, {
        type: "room_member_joined",
        member,
      });
    }

    res.status(201).json(
      member ?? { message: "User is already a member" }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to join room" });
  }
});

// Leave room
app.delete(
  "/api/rooms/:roomId/members/:userId",
  requireAuth,
  async (req, res) => {
    const roomId = parseId(req.params.roomId);
    const userId = parseId(req.params.userId);

    if (!roomId || !userId) {
      return res.status(400).json({ error: "Invalid roomId or userId" });
    }

    if (userId !== req.auth.userId) {
      return res.status(403).json({
        error: "You can only leave your own room",
      });
    }

    try {
      const { rowCount } = await pool.query(
        `DELETE FROM room_member
         WHERE room_id = $1 AND user_id = $2`,
        [roomId, userId]
      );

      if (!rowCount) {
        return res.status(404).json({ error: "Membership not found" });
      }

      broadcastToRoom(roomId, {
        type: "room_member_left",
        roomId,
        userId,
      });

      res.sendStatus(204);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to leave room" });
    }
  }
);

// WebSocket
wss.on("connection", (ws) => {
  console.log("Client connected")
  ws.roomId = null

  sendJson(ws, { type: "connected" })

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("RECEIVED:", data)

      if (data.type === "join_room") {
        ws.roomId = data.room_id

        return sendJson(ws, {
          type: "join_room",
          roomId: data.room_id,
          userId: data.user_id,
        })
      }

      // Gửi tin nhắn
      if (data.type === "send_message") {
        const roomId = parseId(data.room_id)
        const userId = parseId(data.user_id)
        const text = data.message?.trim()

        if (!roomId || !userId || !text) {
          return sendJson(ws, {
            type: "error",
            message: "Invalid message data",
          })
        }

        const { rows } = await pool.query(
          `WITH new_message AS (
            INSERT INTO messages (room, user_id, message)
            VALUES ($1, $2, $3)
            RETURNING message_id, room, user_id, message, time_send
          )
          SELECT m.*, u.name, u.username, u.avatar
          FROM new_message m
          JOIN users u ON u.user_id = m.user_id`,
          [roomId, userId, text]
        )

        broadcastToRoom(roomId, {
          type: "new_message",
          message: rows[0],
        });
        console.log("BROADCAST:", rows[0])

        return
      }

      if (data.type === "leave_room") {
        ws.roomId = null
        return sendJson(ws, { type: "room_left" })
      }

      if (data.type === "ping") {
        return sendJson(ws, { type: "pong" })
      }

      sendJson(ws, {
        type: "error",
        message: "Unknown event",
      })
    } catch (error) {
      console.error(error)

      sendJson(ws, {
        type: "error",
        message: "Invalid message",
      })
    }
  })

  ws.on("close", () => console.log("Client disconnected"))
})

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

