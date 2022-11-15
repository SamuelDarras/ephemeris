const modal = new bootstrap.Modal(document.getElementById('myModal'))
const modalDay = document.getElementById("modalDay");

document.getElementById('myModal').addEventListener("hidden.bs.modal", () => document.getElementById("modalForm").reset())


async function constructCalandar(id) {
    let calandar = document.getElementById(id)

    let now = new Date("10/10/2022")
    let offsetMonth = new Date(now.getFullYear(), now.getMonth()).getDay()


    let rdvs = await fetch(`/event/getMonth/${now.getFullYear()}/${now.getDate()}`, {
        credentials: 'same-origin'
    })
    rdvs = await rdvs.json()
    let dates = []
    for (let i = 0; i < 42; i++) {
        let curDate = new Date(now.getFullYear(), now.getMonth() + 1, i - offsetMonth + 2)
        let rdv = rdvs.rdvs.filter((v) => new Date(v.date).toDateString() == curDate.toDateString())
        dates.push({
            date: curDate,
            rdv: rdv
        })
    }

    dates = dates.sort((a, b) => a.date < b.date)

    for (let i = 0; i < 6; i++) {
        let row = calandar.insertRow()
        for (let j = 0; j < 7; j++) {
            let curDate = dates[i * 7 + j]

            let cell = row.insertCell()
            let div = document.createElement("div")
            cell.appendChild(div)
            div.ondblclick = () => handleClickOnDay(curDate.date)
            div.innerHTML = `\
            ${curDate.date.toDateString().split(' ')[2]}\
            <br>\
            `

            for (let rdv of curDate.rdv) {
                let dateExacte = new Date(rdv.date)
                div.innerHTML += `\
                    <button class="btn btn-success">${dateExacte.getHours().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })}:${dateExacte.getMinutes().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })} - ${rdv.title}</button>\
                    <br>
                    <br>
                `
            }
        }
    }
}

function handleClickOnDay(date) {
    modal.show()
    modalDay.value = [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
}

function formValidate() {
    let titre = document.getElementById("titre");
    let heure = document.getElementById("date");

    let errorTitre = document.getElementById("titreError");
    let errorHeure = document.getElementById("heureError");

    let error = 0;

    if (titre.value.length == 0) {
        errorTitre.innerHTML = "Le titre ne doit pas être vide"
        errorTitre.classList.remove("d-none")
        error += 1
    }
    else {
        errorTitre.classList.add("d-none");
    }

    if (heure.value.length == 0) {
        errorHeure.innerHTML = "L'heure ne doit pas être vide"
        errorHeure.classList.remove("d-none")
        error += 1
    }
    else {
        errorHeure.classList.add("d-none");
    }

    if (!error) {
        let date = new Date(modalDay.value)
        date.setHours(...heure.value.split(":"))

        fetch("/event/create/", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: titre.value, date: date, place: document.getElementById("lieux").value, description: document.getElementById("description").value})
        }).then(modal.hide())
    }

}

constructCalandar("calandar")
