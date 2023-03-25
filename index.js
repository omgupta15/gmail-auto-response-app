import dotenv from "dotenv";
dotenv.config();

import express from "express";

// Database
import db from "./mockdb.js";

// APIs
import oauth2 from "./api/oauth2/index.js";

import("./auto-response.js");

const app = express();
const port = process.env.PORT;

// Configurations
app.set("view engine", "ejs");
app.set("x-powered-by", false);

// Middlewares
app.use(express.json());
app.use(express.static("static"));

app.get("/login", async (req, res) => {
  const googleOAuth2Url = oauth2.getAuthUrl();
  res.render("login", { authUrl: googleOAuth2Url });
});

app.get("/verify", async (req, res) => {
  const { code, scope } = req.query;

  if (!code || typeof code !== "string" || !scope || typeof scope !== "string")
    return res.sendStatus(401);

  const scopes = scope.split("%20");

  const googleUser = await oauth2.verifyCode(code);
  if (!googleUser.success) return res.send("invalid request");

  const user = {
    tokens: googleUser,
    addedOn: new Date(),
    lastCheckedOn: new Date(),
  };
  db.users.push(user);
  db.save();

  res.send("success");
});

app.listen(port, () => {
  console.log(`Server started on http://127.0.0.1:${port}/login`);
});
