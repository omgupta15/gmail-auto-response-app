import dotenv from "dotenv";
dotenv.config();

import express from "express";

// Databse
import db from "./mockdb.js";

// APIs
import oauth2 from "./api/oauth2/index.js";

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

  let code1 =
      "4/0AVHEtk7sLMUYJM8d4LnKrlQzmKcurtFmvZCWMjy77g0sjBb3xGg0WEU31mADdkZogSc8VA",
    scope1 =
      "https://mail.google.com/%20https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.addons.current.action.compose%20https://www.googleapis.com/auth/gmail.addons.current.message.action%20https://www.googleapis.com/auth/gmail.addons.current.message.readonly%20https://www.googleapis.com/auth/gmail.addons.current.message.metadata%20https://www.googleapis.com/auth/gmail.metadata%20https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.labels%20https://www.googleapis.com/auth/gmail.insert%20https://www.googleapis.com/auth/gmail.settings.sharing%20https://www.googleapis.com/auth/gmail.settings.basic%20https://www.googleapis.com/auth/gmail.compose%20https://www.googleapis.com/auth/gmail.modify";

  const scopes = scope.split("%20");

  const googleUser = await oauth2.verifyCode(code);
  if (!googleUser.success) return res.send("invalid request");

  const user = { tokens: googleUser, createdOn: new Date() };
  db.users.push(user);
  db.save();

  res.send("success");
});

app.listen(port, () => {
  console.log(`Server started on http://127.0.0.1:${port}/`);
});
