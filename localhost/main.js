const express = require("express")
const app = express()
const path = require("path")

const port = 8080

app.use(express.static(path.join(__dirname, '../public',)))

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