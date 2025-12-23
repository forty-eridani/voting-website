let form = document.querySelector("#form");

form.addEventListener("submit", (e) => {
  e.preventDefault();
});

let hasSubmitted = false;

window.addEventListener("load", (event) => {
  console.log(document.cookie);
});

const send = document.querySelector("#submitButton");
send.addEventListener("click", async () => {
  if (document.cookie.includes("hasSubmitted") || hasSubmitted) {
    alert("nice try you tricky sigma, but you already submitted today!!!111");
    return;
  }

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
      console.log(data);
      if (data.isTaken) {
        alert("YOU ARE STUPID THAT's ALREADY TAKEN");
        return true;
      }

      hasSubmitted = true;
      return false;
    });
  //   .then((isTaken) => {
  //     if (!isTaken) {
  //       let date = new Date();
  //       let midnight = new Date();
  //       midnight.setHours(23, 59, 59, 999);

  //       let timeUntilMidnight = (midnight.getTime() - date.getTime()) / 1000;

  //       console.log(timeUntilMidnight);
  //       document.cookie = `hasSubmitted=true; max-age=${Math.floor(
  //         timeUntilMidnight
  //       ).toString()}`;
  //     }
  //   }
  // );
});
