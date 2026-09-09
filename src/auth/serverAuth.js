import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-key";

export function requireAuth(req, res, next) {
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

export function registerAuthRoutes(app, pool) {
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
}
