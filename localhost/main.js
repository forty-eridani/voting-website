import express from "express";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";
import cookieParser from "cookie-parser";
const app = express();

const db = new DatabaseSync(path.join(import.meta.dirname, "../logins.db"));

// The password is hashed
db.exec(`
    CREATE TABLE IF NOT EXISTS logins (
        username VARCHAR PRIMARY KEY NOT NULL,
        password VARCHAR NOT NULL,
        activated BOOLEAN NOT NULL DEFAULT 0
    )    
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS motds (
        message VARCHAR NOT NULL PRIMARY KEY,
        author VARCHAR NOT NULL,
        votes INTEGER NOT NULL
    )    
`);

let sessionTokens = {};

app.use(express.json());
app.use(cookieParser());

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

app.get("/submissions", (req, res) => {
  const getSubmissions = db.prepare(`SELECT * FROM motds`);

  const motds = getSubmissions.all();

  res.send(JSON.stringify(motds));
});

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
            const uuid = crypto.randomUUID();

            res.cookie("sessionID", uuid, {
              httpOnly: true,
              maxAge: 3600000,
            });
            res.send(
              JSON.stringify({
                status: `Success`,
                code: 1,
              })
            );

            sessionTokens[uuid] = username;
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

function sortSubmissions(subs) {
  let cpy = [...subs];

  cpy.sort((a, b) => {
    if (a.votes < b.votes) {
      return 1;
    } else if (a.votes > b.votes) {
      return -1;
    } else {
      return 0;
    }
  });

  return cpy;
}

app.post("/submit", (req, res) => {
  const motd = req.body.MOTD;
  const sessionID = req.cookies["sessionID"];

  const getMOTDs = db.prepare("SELECT * FROM motds");
  const insertMOTD = db.prepare(
    `INSERT INTO motds (message, author, votes) VALUES(?, ?, ?)`
  );

  const motds = getMOTDs.get();

  if (motds != undefined && motds[motd] != undefined) {
    res.send(
      JSON.stringify({
        isTaken: true,
      })
    );

    return;
  }

  insertMOTD.run(motd, sessionTokens[sessionID], 0);
});

app.post("/vote", (req, res) => {
  const voteIndex = req.body.voteIndex;

  const getSubmissions = db.prepare(`SELECT * FROM motds`);
  const motds = getSubmissions.all();

  const message = motds[voteIndex];
});

app.post("/reset", (req, res) => {});
