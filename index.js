const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Middleware, um JSON-Daten im Anfrage-Body zu parsen
app.use(express.json());

// Pfad zur JSON-Datei
const dataFilePath = path.join(__dirname, "data.json");

// Hilfsfunktion, um Daten aus der JSON-Datei zu lesen
const readData = () => {
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }
  const rawData = fs.readFileSync(dataFilePath);
  return JSON.parse(rawData);
};

// Hilfsfunktion, um Daten in die JSON-Datei zu schreiben
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

  // Hier können Sie die Logik zur Überprüfung des Tokens hinzufügen
  const validToken = process.env.BEARER_TOKEN || "mySecretToken";

  if (token !== validToken) {
    return res.status(403).send("Forbidden: Invalid token");
  }

  next();
};

// Route zum Hinzufügen eines neuen URL-Slugs mit Authentifizierung
app.post("/add-url", authenticate, (req, res) => {
  const { slug, url } = req.body;

  if (!slug || !url) {
    return res.status(400).send("slug and url are required");
  }

  const data = readData();
  data.push({ slug, url });
  writeData(data);

  res.status(201).send("URL added successfully");
});

// Route zum Abrufen einer URL anhand des Slugs
app.get("/url/:slug", (req, res) => {
  const { slug } = req.params;
  const data = readData();
  const entry = data.find((item) => item.slug === slug);

  if (!entry) {
    return res.status(404).send("URL not found");
  }

  res.send(entry.url);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
