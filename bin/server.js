const express = require('express');
const path = require('path');
let finalResult = require('../app/app.js');
//import { finalResult } from "../app/app.js";

const app = express();

let resultado = finalResult;


app.use(express.static(path.join(__dirname, "../app")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../app/index.html"));
});

app.get("/data", (req, res) => {
	resultado = finalResult.getResult();
  res.send(resultado);
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Example app is listening on port 3000.")
);
