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

// PostgreSQL
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


// ====================
// Helper functions
// ====================

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendJson(ws, data) {
  ws.send(JSON.stringify(data));
}

function broadcastToRoom(roomId, data) {
  wss.clients.forEach((client) => {
    if (
      client.readyState === 1 &&
      client.roomId === roomId
    ) {
      sendJson(client, data);
    }
  });
}

/* Shared implementation is imported from auth/serverAuth.js.
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}


// ====================
// REST API
*/
// ====================

/* Legacy login route kept disabled; both servers now use registerAuthRoutes below.
app.post("/api/login", async (req, res) => {
  const username = String(req.body?.username ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT user_id, name, username, avatar, password FROM users WHERE username = $1`,
      [username]
    );
    const user = rows[0];

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const { password: _password, ...safeUser } = user;
    const token = jwt.sign(
      { userId: safeUser.user_id, username: safeUser.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", token, user: safeUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to log in" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT user_id, name, username, avatar FROM users WHERE user_id = $1`,
      [req.auth.userId]
    );

    if (!rows[0]) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get current user" });
  }
});

// Lấy danh sách room
*/
registerAuthRoutes(app, pool);

app.get("/api/rooms", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        r.room_id,
        r.room_name,
        COUNT(rm.room_member_id)::int AS member_count
      FROM room r
      LEFT JOIN room_member rm
        ON rm.room_id = r.room_id
      GROUP BY r.room_id, r.room_name
      ORDER BY r.room_id ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to get rooms",
    });
  }
});


// Lấy member của room
// Lay danh sach users cho giao dien chat.
app.get("/api/users", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT user_id, name, username, avatar
      FROM users
      ORDER BY user_id ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to get users",
    });
  }
});

app.get("/api/rooms/:roomId/members", requireAuth, async (req, res) => {
  const roomId = parseId(req.params.roomId);

  if (!roomId) {
    return res.status(400).json({
      error: "Invalid roomId",
    });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM room_member
      WHERE room_id = $1
      ORDER BY joined_at ASC
      `,
      [roomId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to get members",
    });
  }
});


// Thêm user vào room
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

    if (membership.rowCount === 0) {
      return res.status(403).json({
        error: "Join this room before viewing its messages",
      });
    }

    const [messagesResult, membersResult] = await Promise.all([
      pool.query(
        `
        SELECT m.message_id, m.room, m.message, m.time_send,
               u.user_id, u.name, u.username, u.avatar
        FROM messages m
        JOIN users u ON u.user_id = m.user_id
        WHERE m.room = $1
        ORDER BY m.time_send ASC, m.message_id ASC
        `,
        [roomId]
      ),
      pool.query(
        `
        SELECT u.user_id, u.name, u.username, u.avatar
        FROM users u
        JOIN room_member rm ON u.user_id = rm.user_id
        WHERE rm.room_id = $1
        ORDER BY u.user_id ASC
        `,
        [roomId]
      ),
    ]);

    res.json({
      messages: messagesResult.rows,
      members: membersResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get room conversation" });
  }
});

app.post("/api/rooms/:roomId/members", requireAuth, async (req, res) => {
  const roomId = parseId(req.params.roomId);
  const userId = parseId(req.auth.userId);

  if (!roomId || !userId) {
    return res.status(400).json({
      error: "Invalid roomId or userId",
    });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO room_member
        (room_id, user_id)
      VALUES
        ($1, $2)
      ON CONFLICT (room_id, user_id)
      DO NOTHING
      RETURNING *
      `,
      [roomId, userId]
    );

    const member = rows[0];

    if (member) {
      broadcastToRoom(roomId, {
        type: "room_member_joined",
        member,
      });
      console.log(`User ${userId} joined room ${roomId}`);
    }

    res.status(201).json(member ?? {
      message: "User is already a member",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to join room",
    });
  }
});


// Xóa user khỏi room
app.delete(
  "/api/rooms/:roomId/members/:userId",
  requireAuth,
  async (req, res) => {
    const roomId = parseId(req.params.roomId);
    const userId = parseId(req.params.userId);

    if (!roomId || !userId) {
      return res.status(400).json({
        error: "Invalid roomId or userId",
      });
    }

    if (userId !== req.auth.userId) {
      return res.status(403).json({ error: "You can only leave your own room" });
    }

    try {
      const { rowCount } = await pool.query(
        `
        DELETE FROM room_member
        WHERE room_id = $1
        AND user_id = $2
        `,
        [roomId, userId]
      );

      if (rowCount === 0) {
        return res.status(404).json({
          error: "Membership not found",
        });
      }

      broadcastToRoom(roomId, {
        type: "room_member_left",
        roomId,
        userId,
      });

      res.status(204).send();

    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Failed to leave room",
      });
    }
  }
);


// ====================
// WebSocket
// ====================

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.roomId = null;

  sendJson(ws, {
    type: "connected",
  });


  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      // JOIN ROOM
      if (data.type === "join_room") {
        ws.roomId = data.room_id;

        sendJson(ws, {
          type: "join_room",
          roomId: data.room_id,
          userId: data.user_id,
        });

        return;
      }


      // LEAVE ROOM
      if (data.type === "leave_room") {
        ws.roomId = null;

        sendJson(ws, {
          type: "room_left",
        });

        return;
      }


      // PING
      if (data.type === "ping") {
        sendJson(ws, {
          type: "pong",
        });

        return;
      }


      // Unknown event
      sendJson(ws, {
        type: "error",
        message: "Unknown event",
      });

    } catch (error) {
      sendJson(ws, {
        type: "error",
        message: "Invalid message",
      });
    }
  });


  ws.on("close", () => {
    console.log("Client disconnected");
  });
});


// ====================
// Start server
// ====================

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
