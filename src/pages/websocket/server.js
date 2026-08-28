import express from "express";
import cors from "cors";
import pg from "pg";
import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import http from "http";

const { Pool } = pg;

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "chatapp",
  password: "010902",
  port: 5432,
});

// Get users
app.get("/api/users", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT user_id, name, avatar
      FROM users
      ORDER BY user_id
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

// Get chats
app.get("/api/chats", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT chat_id
      FROM chats
      ORDER BY chat_id
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get chats" });
  }
});

// Get messages of a chat
app.get("/api/chats/:chatId/messages", async (req, res) => {
  try {
    const { chatId } = req.params;

    const { rows } = await pool.query(`
      SELECT
        m.message_id,
        m.chat_id,
        m.message,
        m.time_send,
        u.user_id,
        u.name,
        u.avatar
      FROM messages m
      JOIN users u ON u.user_id = m.user_id
      WHERE m.chat_id = $1
      ORDER BY m.time_send ASC
    `, [chatId]);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Find a direct chat between two users
app.get("/api/chats/lookup", async (req, res) => {
  try {
    const userA = Number(req.query.userA);
    const userB = Number(req.query.userB);

    if (!Number.isInteger(userA) || !Number.isInteger(userB)) {
      return res.status(400).json({
        error: "Missing or invalid userA or userB",
      });
    }

    const { rows } = await pool.query(
      `
      SELECT chat_id
      FROM messages
      WHERE user_id = $1 OR user_id = $2
      GROUP BY chat_id
      HAVING COUNT(DISTINCT user_id) = 2
      ORDER BY chat_id ASC
      LIMIT 1
      `,
      [userA, userB]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Chat not found",
      });
    }

    res.json({
      chatId: rows[0].chat_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to look up chat" });
  }
});

// POST /api/chats/:chatId/messages
app.post("/api/chats/:chatId/messages", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId, message } = req.body;

    const cleanMessage = String(message ?? "").trim();
    const parsedChatId = Number(chatId);
    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedChatId) || !Number.isInteger(parsedUserId) || cleanMessage.length === 0) {
      return res.status(400).json({
        error: "Missing or invalid chatId, userId, or message",
      });
    }

    const { rows } = await pool.query(
      `
      WITH inserted AS (
        INSERT INTO messages (chat_id, user_id, message, time_send)
        VALUES ($1, $2, $3, NOW())
        RETURNING message_id, message, time_send, user_id
      )
      SELECT
        i.message_id,
        i.chat_id,
        i.message,
        i.time_send,
        u.user_id,
        u.name,
        u.avatar
      FROM inserted i
      JOIN users u ON u.user_id = i.user_id
      `,
      [parsedChatId, parsedUserId, cleanMessage]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to create message",
    });
  }
});

// POST /api/login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Tìm user theo username
    const result = await pool.query(
      `
      SELECT user_id, name, username, avatar, password
      FROM "users"
      WHERE username = $1
      `,
      [username]
    );

    // Không tìm thấy username
    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Username hoặc password không đúng",
      });
    }

    const user = result.rows[0];

    // Kiểm tra password
    if (user.password !== password) {
      return res.status(401).json({
        message: "Username hoặc password không đúng",
      });
    }

    // Tạo JWT
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Không trả password về frontend
    delete user.password;

    res.json({
      message: "Đăng nhập thành công",
      token,
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

//coorrng websocket
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket connected");

  ws.on("message", async (data) => {
    try {
      const payload = JSON.parse(data.toString());

      console.log("Message:", payload);

      // Frontend gửi identify
      if (payload.type === "identify") {
        console.log(`User ${payload.userId} identified`);
        return;
      }

      // Frontend gửi tin nhắn
      if (payload.type === "send_message") {
        const {
          chatId,
          senderId,
          receiverId,
          message,
        } = payload;

        const cleanMessage = String(message ?? "").trim();

        // Check dữ liệu
        if (
          !Number.isInteger(Number(chatId)) ||
          !Number.isInteger(Number(senderId)) ||
          cleanMessage.length === 0
        ) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message data",
            })
          );

          return;
        }

        // INSERT VÀO BẢNG MESSAGES
        const { rows } = await pool.query(
          `
          WITH inserted AS (
            INSERT INTO messages (
              message,
              user_id,
              chat_id,
              time_send
            )
            VALUES ($1, $2, $3, NOW())
            RETURNING
              message_id,
              message,
              user_id,
              chat_id,
              time_send
          )

          SELECT
            i.message_id,
            i.chat_id,
            i.message,
            i.time_send,
            u.user_id,
            u.name,
            u.avatar

          FROM inserted i
          JOIN users u
            ON u.user_id = i.user_id
          `,
          [
            cleanMessage,
            Number(senderId),
            Number(chatId),
          ]
        );

        const newMessage = rows[0];

        console.log("Message saved:", newMessage);

        // Gửi thông báo tin nhắn mới
        const response = JSON.stringify({
          type: "new_message",
          message: newMessage,
        });

        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(response);
          }
        });
      }

    } catch (error) {
      console.error("WebSocket error:", error);

      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to process message",
        })
      );
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
