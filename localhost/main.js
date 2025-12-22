const express = require('express')
const app = express()

app.use(express.json())

const port = 8080

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})

app.get("/", (req, res) => {

})

app.get("/create", (req, res) => {

})

app.get("/submissions", (req, res) => {

})

app.post("/submit", (req, res) => {

})

app.post("/vote", (req, res) => {

})

app.post("/reset", (req, res) => {

})