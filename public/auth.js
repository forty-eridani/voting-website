let signInButton = document.getElementById("submit");

signInButton.addEventListener("click", () => {
  let form = document.getElementById("form");

  let fields = new FormData(form);

  let username = fields.get("username");
  let password = fields.get("password");

  if (username.length == 0) {
    alert("Username field cannot be empty.");
    return;
  } else if (password.length == 0) {
    alert("Password field cannot be empty");
    return;
  }

  fetch("/login", {
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

      document.cookie = `session-id=${data.token}; Secure;`;
    });
});
