const express = require("express")
const app = express()
const path = require("path")

const port = 8080

app.use(express.static(path.join(__dirname, '../public',)))
app.use(express.json())

app.listen(port, function() {
    console.log(`Listening on port ${port}`)
})

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "../index.html"))
})

app.get("/:path", function(req, res) {
    p = path.join(__dirname, "../" + req.params.path)
    console.log(p)
    res.sendFile(p)
})

let submissions = []

function merge(l, r) {
    let lIndex = 0;
    let rIndex = 0;

    let final = []

    while (lIndex < l.length && rIndex < r.length) {
        if (l[lIndex].votes < r[rIndex].votes)
            final.push(l[lindex++])
        else
            final.push(r[rIndex++])
    }

    final = final.concat(l.slice(lIndex, l.length))
    final = final.concat(r.slice(rIndex, r.length))

    return final
}

function sortSubmissions(submissions) {
    if (submissions.length <= 1)
        return submissions

    let mid = Math.floor(submissions.length / 2)

    left = submissions.toSpliced(0, mid)
    right = submissions.toSpliced(mid, submissions.length)

    left = sortSubmissions(left)
    right = sortSubmissions(right)

    submissions = merge(left, right)

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

app.post('/submissions', (req, res) => {
    
})