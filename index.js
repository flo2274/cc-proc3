require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const dataFilePath = path.join(__dirname, "data.json");

const readData = () => {
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }
  const rawData = fs.readFileSync(dataFilePath);
  return JSON.parse(rawData);
};

const writeData = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

// Middleware zur Authentifizierung
const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).send("Unauthorized: No token provided");
  }

  const validToken = process.env.BEARER_TOKEN || "mySecretToken";

  if (token !== validToken) {
    return res.status(403).send("Forbidden: Invalid token");
  }

  next();
};

// Route zum Hinzufügen eines neuen URL-Slugs mit Authentifizierung
app.post("/entry", authenticate, (req, res) => {
  const { slug, url } = req.body;

  if (!url) {
    return res.status(400).send("url is required");
  }

  let newSlug = slug;
  if (!newSlug) {
    newSlug = crypto.randomBytes(4).toString("hex");
  }

  const data = readData();
  data.push({ slug: newSlug, url });
  writeData(data);

  res.status(201).send({ message: "URL added successfully", slug: newSlug });
});

// Route zum Abrufen aller URL-Slugs mit Authentifizierung
app.get("/entries", authenticate, (req, res) => {
  const data = readData();
  res.json(data);
});

// Route zum Abrufen einer URL anhand des Slugs und Umleiten
app.get("/:slug", (req, res) => {
  const { slug } = req.params;
  const data = readData();
  const entry = data.find((item) => item.slug === slug);

  if (!entry) {
    return res.status(404).send("URL not found");
  }

  res.redirect(entry.url);
});

// Route zum Löschen eines Eintrags anhand des Slugs mit Authentifizierung
app.delete("/entry/:slug", authenticate, (req, res) => {
  const { slug } = req.params;
  let data = readData();
  const initialLength = data.length;
  data = data.filter((item) => item.slug !== slug);

  if (data.length === initialLength) {
    return res.status(404).send("URL not found");
  }

  writeData(data);
  res.status(200).send("URL deleted successfully");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
