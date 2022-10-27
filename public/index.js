function connect() {
    let name = document.getElementById("nameInput").value;
    let password = document.getElementById("passwordInput").value;
    let error = document.getElementById("errorAlert");

    fetch("/connect/", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name:name, password:password})
    }).then((response) => {
        if (response.status === 200) {
            window.location.href = "calendar.html"
        }
        else {
            error.classList.add("show")
            console.log(response.json());
        }
    })
}