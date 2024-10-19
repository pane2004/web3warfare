const express = require("express");
const app = express();
const port = 3000;

app.get("/api", (req, res) => {
  res.json({
    value1: 24.25,
    value2: 49.54,
    value3: 1005.14,
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
