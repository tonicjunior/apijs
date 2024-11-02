const express = require("express");
const path = require("path");
const indexRouter = require("./routes/index");

const app = express();
const PORT = 3000;

const cors = require("cors");

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "https://tonicjunior.github.io",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRouter);
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
