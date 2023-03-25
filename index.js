import dotenv from "dotenv";
dotenv.config();

import express from "express";

const app = express();
const port = process.env.PORT;

// Configurations
app.set("view engine", "ejs");
app.set("x-powered-by", false);

// Middlewares
app.use(express.json());

app.get("/login", async (req, res) => {
  res.send("Hi");
});

app.post("/login", async (req, res) => {
  res.send("Hi");
});

app.listen(port, () => {
  console.log(`Server started on http://127.0.0.1:${port}/`);
});
