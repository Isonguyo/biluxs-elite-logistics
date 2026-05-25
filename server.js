import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import compression from "compression";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());

// Serve static files from dist/client
app.use(express.static("dist/client", {
  maxAge: "1d",
  etag: false,
}));

// Serve index.html for all routes (SPA)
app.get("*", (req, res) => {
  res.sendFile("dist/client/index.html", { root: __dirname });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
