const signedOutButtons = document.getElementsByClassName("login-state");
const parser = new DOMParser();

console.log(signedOutButtons);
window.addEventListener("load", (event) => {
  fetch("/login-state", {
    method: "GET",
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
      if (data.login) {
        for (let i = 0; i < signedOutButtons.length; i++) {
          signedOutButtons[i].classList.add("signed-in");
        }
      }
    });
});
