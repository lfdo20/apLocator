const express = require('express');
const path = require('path');
const apLocator = require('../app/app.js');
const app = express();

let resultado;

app.use(express.static(path.join(__dirname, "../app")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/index.html"));
});

app.get("/data", (req, res) => {
	resultado = apLocator.getResult();
  res.send(resultado);
});

app.get("/lasts", (req, res) => {
	resultado = apLocator.lastResults();
	res.send(resultado);
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Example app is listening on port 3000.")
);
