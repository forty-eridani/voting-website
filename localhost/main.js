const express = require("express")
const app = express()
const path = require("path")
const fs = require('fs')
const https = require('https')
const { Server } = require("http")

const port = 8080

app.use(express.static(path.join(__dirname, '../public',)))

const options = {
    key: fs.readFileSync(path.join(__dirname, '../' + 'certs/server.key'), 'utf8'),
    cert: fs.readFileSync(path.join(__dirname, '../' + 'certs/server.crt'), 'utf-8')
}

https.createServer(options, app).listen(port, () => {
    console.log(`HTTPS on port ${port}`)
})

app.use(express.json())

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "../index.html"))
})

app.get("/:path", function(req, res) {
    if (req.params.path[1] == 'e')
        res.status(404).send('Resource Not Found')
    
    p = path.join(__dirname, "../" + req.params.path)

    console.log(p)
    res.sendFile(p)
})

let submissions = []

function slice(arr, min, max) {
    let final = []

    for (let i = min; i < max; i++) {
        final.push(arr[i])
    }

    return final
}

function merge(l, r) {
    let lIndex = 0;
    let rIndex = 0;

    let final = []

    while (lIndex < l.length && rIndex < r.length) {
        if (l[lIndex].votes >= r[rIndex].votes)
            final.push(l[lIndex++])
        else
            final.push(r[rIndex++])
    }

    final = final.concat(l.slice(lIndex))
    final = final.concat(r.slice(rIndex))

    return final
}

function sortSubmissions(submissions) {
    // if (submissions.length <= 1)
    //     return submissions

    // let mid = Math.floor(submissions.length / 2)

    // left = slice(submissions, 0, mid)
    // right = slice(submissions, mid, submissions.length)

    // left = sortSubmissions(left)
    // right = sortSubmissions(right)

    // return merge(left, right)

    for (let i = 0; i < submissions.length; i++) {
        for (let j = 0; j < submissions.length - i - 1; j++) {
            if (submissions[j].votes < submissions[j + 1].votes) {
                let tmp = submissions[j]
                submissions[j] = submissions[j + 1]
                submissions[j + 1] = tmp
            }
        }
    }

    return submissions
}

function motdExists(motd) {
    let doesExist = false;

    submissions.forEach((submission) => {
        if (motd == submission.motd)
            doesExist = true
    })

    return doesExist
}

app.post('/submit', (req, res) => {
    if (motdExists(req.body.MOTD)) {
        res.send(JSON.stringify({
            oops: 69
        }))

        return
    }

    submissions.push({
        motd: req.body.MOTD,
        votes: 0
    })
    
    // console.log(submissions)

    console.log(sortSubmissions(submissions))

    res.send(JSON.stringify(submissions))
})

app.post('/submissions', (_, res) => {
    let tmp = sortSubmissions(submissions)
    submissions = tmp
    console.log(submissions)
    res.send(JSON.stringify(submissions))
})

app.post("/vote", (req, res) => {
    let index = req.body.voteIndex

    submissions[index].votes += 1

    res.send(JSON.stringify({votes: submissions[index].votes}))
})

app.post("/reset", (req, res) => {
    console.log(req.body)
    if (req.body.sigma != undefined && req.body.sigma != "no you stinker") {
        res.send("QUIT BEING SUCH A STINKER")
        return
    }

    if (submissions.length == 0) {
        res.send(JSON.stringify({motd: "", votes: -1}))
        return
    }

    res.send(JSON.stringify(submissions[0]))

    submissions = []
})