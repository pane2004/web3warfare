import express from 'express';
const app = express();
const port = 3001;

app.get('/api', (req, res) => {
  res.json({
    value1: 24.25,
    value2: 49.54,
    value3: 1005.14
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
