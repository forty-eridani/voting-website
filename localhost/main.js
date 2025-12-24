import express from "express";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import crypto, { sign } from "crypto";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { stat } from "fs";
const app = express();

const db = new DatabaseSync(path.join(import.meta.dirname, "../data.db"));

// The password is hashed
db.exec(`
    CREATE TABLE IF NOT EXISTS logins (
        username VARCHAR PRIMARY KEY NOT NULL,
        password VARCHAR NOT NULL,
        activated BOOLEAN NOT NULL DEFAULT 0,
        hasVoted BOOLEAN NOT NULL DEFAULT 0
    )    
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS motds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message VARCHAR NOT NULL,
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

  res.send(JSON.stringify(sortSubmissions(motds)));
});

app.get("/public/:path", (req, res) => {
  console.log(req.params.path);
  res.sendFile(path.join(import.meta.dirname, `../public/${req.params.path}`));
});

app.get("/favicon.ico", (req, res) => {
  res.send(path.join(import.meta.dirname, `../public/favicon.ico`));
});

app.get("/login-state", (req, res) => {
  const browserSessionID = req.cookies["sessionID"];

  res.send(
    JSON.stringify({
      login: sessionTokens[browserSessionID] != undefined,
    })
  );
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

        return;
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

            return;
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
    `INSERT INTO logins (username, password) VALUES (?, ?)`
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

        return;
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

      bcrypt.hash(password, 10).then((hash) => {
        addUser.run(username, hash);
      });

      res.send(
        JSON.stringify({
          status: "Success",
          code: 1,
        })
      );
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

const getUser = db.prepare("SELECT * FROM logins WHERE username = ?");

app.post("/submit", (req, res) => {
  const motd = req.body.MOTD;
  const sessionID = req.cookies["sessionID"];

  const getMOTDs = db.prepare("SELECT * FROM motds");
  const getMOTDsFromMessage = db.prepare(
    "SELECT * FROM motds WHERE message = ?"
  );

  const getMOTDsFromUser = db.prepare("SELECT * FROM motds WHERE author = ?");

  const insertMOTD = db.prepare(
    `INSERT INTO motds (message, author, votes) VALUES(?, ?, ?)`
  );

  const motds = getMOTDs.all();
  const copyMOTDs = getMOTDsFromMessage.all(motd);

  console.log(JSON.stringify(motds) + " are the motds");
  if (copyMOTDs.length != 0) {
    res.send(
      JSON.stringify({
        status: "That MOTD already exists.",
        code: -1,
      })
    );

    return;
  }

  if (sessionTokens[sessionID] == undefined) {
    res.send(
      JSON.stringify({
        status: "You are logged out. Please log back in.",
        code: -1,
      })
    );

    return;
  }

  const user = getUser.get(sessionTokens[sessionID]);

  if (user.activated == 0) {
    res.send(
      JSON.stringify({
        status: "Your account has not been activated. Please talk to Nolan.",
        code: -1,
      })
    );

    return;
  }

  const motdsFromUser = getMOTDsFromUser.all(sessionTokens[sessionID]);
  if (motdsFromUser.length != 0) {
    res.send(
      JSON.stringify({
        status: "You have already submitted an MOTD today!",
        code: -1,
      })
    );

    return;
  }

  insertMOTD.run(motd, sessionTokens[sessionID], 0);
});

const getVotes = db.prepare("SELECT votes FROM motds WHERE id = ?");
const updateVotes = db.prepare("UPDATE motds SET votes = ? WHERE id = ?");

const hasVotedMethod = db.prepare(
  "SELECT hasVoted FROM logins WHERE username = ?"
);
const setHasVoted = db.prepare(
  "UPDATE logins SET hasVoted = 1 WHERE username = ?"
);

app.post("/vote", (req, res) => {
  const id = req.body.voteID;
  const sessionID = req.cookies.sessionID;

  if (sessionID == undefined) {
    res.send(
      JSON.stringify({
        status: "You are not signed in pookie.",
        code: -1,
      })
    );

    return;
  }

  if (sessionTokens[sessionID] == undefined) {
    res.send(
      JSON.stringify({
        status:
          "Your session has expired there. You're gonna have to sign in again.",
        code: -1,
      })
    );

    return;
  }

  const user = getUser.get(sessionTokens[sessionID]);
  console.log(user, "is the user.");

  if (user.activated == 0) {
    res.send(
      JSON.stringify({
        status:
          "grrrr your account hasn't been activated yet. Talk to Nolan to get it activated.",
        code: -1,
      })
    );

    return;
  }

  const hasVoted = hasVotedMethod.get(sessionTokens[sessionID]).hasVoted;

  if (hasVoted == 1) {
    res.send(
      JSON.stringify({
        status: "You have already voted pookie!!!1!",
        code: -1,
      })
    );

    return;
  }

  const votes = getVotes.get(id).votes;
  console.log(votes);
  updateVotes.run(votes + 1, id);

  setHasVoted.run(sessionTokens[sessionID]);

  res.send(
    JSON.stringify({
      status: "Success",
      code: 1,
      votes: votes + 1,
    })
  );
});

// const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
//   modulusLength: 2048,
//   publicKeyEncoding: {
//     type: "spki",
//     format: "pem",
//   },
//   privateKeyEncoding: {
//     type: "pkcs8",
//     format: "pem",
//   },
// });

// fs.writeFileSync(import.meta.dirname + "/../keys/public.key", publicKey);
// fs.writeFileSync(import.meta.dirname + "/../keys/private.key", privateKey);

const activatePublicKey = fs.readFileSync(
  import.meta.dirname + "/../keys/activate.pub"
);
const resetPublicKey = fs.readFileSync(
  import.meta.dirname + "/../keys/reset.pub"
);
// const privateKey = fs.readFileSync(
//   import.meta.dirname + "/../keys/private.key"
// );

// const randomBytes = crypto.randomBytes(512);
// const signedValue = crypto.sign("SHA256", randomBytes, privateKey);

// const verify = crypto.verify("SHA256", randomBytes, publicKey, signedValue);
// console.log(verify);

let random = null;

app.get("/random", (req, res) => {
  random = crypto.randomBytes(512);

  res.send(
    JSON.stringify({
      value: random,
    })
  );
});

app.post("/activate", (req, res) => {
  const activateUser = db.prepare(
    "UPDATE logins SET activated = 1 WHERE username = ?"
  );

  const username = req.body.username;
  const signedBytes = new Uint8Array(req.body.sign.data);

  if (!crypto.verify("SHA256", random, activatePublicKey, signedBytes)) {
    res.send(
      JSON.stringify({
        status: "Could not verify signature.",
        code: -1,
      })
    );

    console.log("Could not verify signature.");

    return;
  }

  if (username == undefined) {
    res.send(
      JSON.stringify({
        status: "User not found in body of request.",
        code: -1,
      })
    );

    return;
  }

  activateUser.run(username);

  res.send(
    JSON.stringify({
      status: "Success",
      code: 1,
    })
  );
});

app.post("/reset", (req, res) => {
  const signedBytes = new Uint8Array(req.body.sign.data);

  if (!crypto.verify("SHA256", random, resetPublicKey, signedBytes)) {
    res.send(
      JSON.stringify({
        status: "Could not verify signature.",
        code: -1,
      })
    );

    return;
  }

  const resetMOTD = db.prepare("DELETE FROM motds WHERE id > -1");
  resetMOTD.run();
});
