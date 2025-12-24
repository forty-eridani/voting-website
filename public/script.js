let form = document.querySelector("#form");

form.addEventListener("submit", (e) => {
  e.preventDefault();
});

let hasSubmitted = false;

window.addEventListener("load", (event) => {
  console.log(document.cookie);
});

const send = document.querySelector("#submitButton");
send.addEventListener("click", () => {
  const userInfo = document.querySelector("#form");
  const motd = new FormData(userInfo).get("motd");

  fetch("/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      MOTD: motd,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      if (data.code == -1) {
        alert(data.status);
        return;
      }

      window.location.replace("/");
    });
});
