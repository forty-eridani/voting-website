let createAccountButton = document.getElementById("submit");

createAccountButton.addEventListener("click", (event) => {
  let form = document.getElementById("form");
  const fields = new FormData(form);

  const username = fields.get("username");
  const password = fields.get("password");

  if (username.length == 0) {
    alert("Username field cannot be empty.");
    return;
  } else if (password.length == 0) {
    alert("Password field cannot be empty");
    return;
  }

  fetch("/create-account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
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

      window.location.replace("/auth");
    });
});
