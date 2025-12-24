import crypto from "crypto";
import fs from "fs";
import { userInfo } from "os";
import { buffer } from "stream/consumers";

const privateKey = fs.readFileSync(import.meta.dirname + "/keys/private.key");

const response = await fetch("http://localhost:8080/random", {
  method: "GET",
});

const data = await response.json();
const randomBytes = new Uint8Array(data.value.data);

const signedBytes = crypto.sign("SHA256", randomBytes, privateKey);

fetch("http://localhost:8080/activate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    sign: signedBytes,
    username: "nolsdude",
  }),
});
