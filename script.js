let form = document.querySelector("#form")

form.addEventListener("submit", (e) => {
    e.preventDefault()
})

function parseCookie(str) {
    if (str.length == 0)
        return

    let pairs = str.split(';')
    let splittedPairs = pairs.map(cookie => cookie.split('='))

    let object = {}

    splittedPairs.forEach(element => {
        object[element[0].trim()] = element[1].trim()
    });

    return object
}

const send = document.querySelector("#submitButton")
send.addEventListener("click", async () => {
    console.log(document.cookie)
    const userInfo = document.querySelector("#form")
    const motd = new FormData(userInfo).get("motd")

    cookies = parseCookie(document.cookie)
    console.log(cookies.time)

    let date = new Date()

    // if (cookies.time != undefined && date.getTime() - Number(cookies.time) < 86400000) {
    //     alert("You cannot submit multiple motds in a single day you tricky sigma")
    //     return
    // }

    let isTaken = false;

    fetch("http://localhost:8080/submit", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            "MOTD": motd
        })
    }).then(res => {
        return res.json()
    }).then(data => {
        if (data.oops == 69) {
            alert("YOU ARE STUPID THAT's ALREADY TAKEN")
            isTaken = true;
            return
        }

        console.log(data)
    })

    if (!isTaken)
        document.cookie = `time=${date.getTime()}`
})