import express from "express";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";
const app = express();

bcrypt
  .hash("password", 5)
  .then((hash) => {
    console.log("Hash of password is", hash);
    return hash;
  })
  .then((hash) => {
    bcrypt.compare("password", hash, (error, result) => {
      console.log(result);
    });
  });

const db = new DatabaseSync(path.join(import.meta.dirname, "../logins.db"));

// The password is hashed
db.exec(`
    CREATE TABLE IF NOT EXISTS logins (
        username VARCHAR PRIMARY KEY NOT NULL,
        password VARCHAR NOT NULL,
        activated BOOLEAN NOT NULL DEFAULT 0
    )    
`);

let sessionTokens = [];

app.use(express.json());

const port = 8080;

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(import.meta.dirname + "/../index.html"));
});

app.get("/auth", (req, res) => {
  res.sendFile(path.join(import.meta.dirname + "/../auth.html"));
});

app.get("/password", (req, res) => {
  res.sendFile(path.join(import.meta.dirname + "/../password.html"));
});

app.get("/create", (req, res) => {
  res.sendFile(path.join(import.meta.dirname, `../create.html`));
});

app.get("/submissions", (req, res) => {});

app.get("/public/:path", (req, res) => {
  console.log(req.params.path);
  res.sendFile(path.join(import.meta.dirname, `../public/${req.params.path}`));
});

app.get("/favicon.ico", (req, res) => {
  res.send(path.join(import.meta.dirname, `../public/favicon.ico`));
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log(typeof username);

  const getUser = db.prepare(`SELECT * FROM logins WHERE username = ?`);

  console.log(getUser.get());

  fetch("http://192.168.0.179:4000/playerlist", {
    method: "GET",
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      const userData = getUser.get(username);

      if (data.names.includes(username) && userData == undefined) {
        res.send(
          JSON.stringify({
            status: "User does not exist yet. Create new user with link below.",
            code: -1,
          })
        );

        return;
      }

      if (!data.names.includes(username)) {
        res.send(
          JSON.stringify({
            status: `User '${username}' does not play on server! If you are a bedrock player, don't forget to prefix your username with a period.`,
            code: -1,
          })
        );
      }

      if (userData != undefined) {
        const passwordHash = userData.password;

        console.log(userData.password);

        bcrypt.compare(password, passwordHash).then((correctPassword) => {
          if (correctPassword === true) {
            res.send(
              JSON.stringify({
                status: `Success`,
                code: 1,
                token: crypto.randomUUID(),
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: `Incorrect password.`,
                code: -1,
              })
            );
          }
        });
      }
    });
});

app.post("/create-account", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const getUser = db.prepare(`SELECT * FROM logins WHERE username = ?`);

  const addUser = db.prepare(
    `INSERT INTO logins (username, password, activated) VALUES (?, ?, ?)`
  );

  fetch("http://192.168.0.179:4000/playerlist", {
    method: "GET",
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      if (!data.names.includes(username)) {
        res.send(
          JSON.stringify({
            status: `User '${username}' does not play on server! If you are a bedrock player, don't forget to prefix your username with a period.`,
            code: -1,
          })
        );
      }

      const userData = getUser.get(username);

      if (userData != undefined) {
        res.send(
          JSON.stringify({
            status: `User '${username}' already exists.`,
            code: -1,
          })
        );

        return;
      }

      bcrypt.hash(password, 5).then((hash) => {
        addUser.run(username, hash, 1);
      });
    });
});

app.post("/submit", (req, res) => {});

app.post("/vote", (req, res) => {});

app.post("/reset", (req, res) => {});
