const modal = new bootstrap.Modal(document.getElementById('myModal'))
const modalDay = document.getElementById("modalDay")
const titre = document.getElementById("titre")
const heure = document.getElementById("date")
const lieux = document.getElementById("lieux")
const description = document.getElementById("description")
const checkboxEnd = document.getElementById("checkboxFin")
const dayEnd = document.getElementById("dateFin")
const heureEnd = document.getElementById("timeFin")

document.getElementById('myModal').addEventListener("hidden.bs.modal", () => {
    document.getElementById("modalForm").reset()
})


document.getElementById('myModal').addEventListener("show.bs.modal", () => {
    dayEnd.disabled = !checkboxEnd.checked
    heureEnd.disabled = !checkboxEnd.checked
})

let mapRdvs = {}

async function constructCalandar(id) {
    let calandar = document.getElementById(id)

    let now = new Date(Date.now())
    let offsetMonth = new Date(now.getFullYear(), now.getMonth()).getDay()


    let res = await fetch(`/event/get-month/${now.getFullYear()}/${now.getMonth() + 1}`, {
        credentials: 'same-origin'
    })
    res = await res.json()
    let dates = []
    for (let i = 0; i < 42; i++) {
        let curDate = new Date(now.getFullYear(), now.getMonth(), i - offsetMonth + 2)
        let rdvs = res.rdvs.filter((v) => {
            mapRdvs[v._id] = v
            return new Date(v.date).toDateString() == curDate.toDateString() || new Date(v.endDate).toDateString() == curDate.toDateString()
        }).map(rdv => {
            let ending = "none"
            if (new Date(rdv.date).toDateString() == curDate.toDateString() && rdv.endDate != null) {
                ending = "debut"
            } else if (rdv.endDate != null && new Date(rdv.endDate).toDateString() == curDate.toDateString()) {
                ending = "fin"
            }
            return {
                ending,
                ...rdv
            }
        })

        dates.push({
            date: curDate,
            rdvs: rdvs
        })
    }

    for (let i = 0; i < 6; i++) {
        let row = document.createElement("div")
        row.classList.add("row")
        row.classList.add("calendar-row")
        calandar.appendChild(row)
        for (let j = 0; j < 7; j++) {
            let curDate = dates[i * 7 + j]

            let cell = document.createElement("div")
            cell.classList.add("col")
            cell.classList.add("calendar-cell")

            row.appendChild(cell)
            cell.onclick = (event) => handleClickOnDay(event, curDate.date)
            let div = document.createElement("div")
            cell.appendChild(div)
            if (curDate.date.toDateString() == now.toDateString()) {
                div.classList.add("today")
            }
            div.innerHTML = `\
            ${curDate.date.toDateString().split(' ')[2]}\
            <br>\
            `

            for (let rdv of curDate.rdvs.sort((rdvA, rdvB) => {
                if (new Date(rdvA.date).getTime() > new Date(rdvB.date).getTime()) {
                    return 1
                } else if (new Date(rdvA.date).getTime() < new Date(rdvB.date).getTime()) {
                    return -1
                } else {
                    return 0
                }
            })) {
                let dateExacte = new Date(rdv.date)
                div.innerHTML += `\
                    <p class="${rdv.ending == 'none' ? '' : rdv.ending} cell-elem ${rdv.endDate == null ? 'tache' : 'rendez-vous'}" onclick="handleClickOnRendezVous(event, '${rdv._id}')">${dateExacte.getHours().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })}:${dateExacte.getMinutes().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })} - ${rdv.title}</p>\
                `
            }
        }
    }
}

function handleClickOnDay(event, date) {
    document.getElementById("addRDVLabel").innerHTML = "Ajouter un rendez-vous le"
    modalDay.value = [date.getFullYear(),
    ("" + (date.getMonth() + 1)).length == 2 ? "" + (date.getMonth() + 1) : "0" + (date.getMonth() + 1),
    ("" + date.getDate()).length == 2 ? "" + date.getDate() : "0" + date.getDate()
    ].join('-')

    document.getElementById("modalValider").onclick = () => {
        if (formValidate()) {
            let date = new Date(modalDay.value)
            date.setHours(...heure.value.split(":"))

            fetch("/event/create/", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: titre.value, date: date, endDate: checkboxEnd.checked ? new Date("" + dayEnd.value + " " + heureEnd.value) : null, place: lieux.value, description: description.value })
            }).then(modal.hide())
        }
    }

    modal.show()
}

function handleClickOnRendezVous(event, rdvId) {
    event.stopPropagation()
    document.getElementById("addRDVLabel").innerHTML = "Rendez-vous le"

    let rdv = mapRdvs[rdvId]
    let date = new Date(rdv.date)
    let dateFin = new Date(rdv.endDate)

    titre.value = rdv.title
    heure.value = ("" + date.getHours()).padStart(2, "0") + ":" + ("" + date.getMinutes()).padStart(2, "0")
    lieux.value = rdv.place
    description.value = rdv.description

    modalDay.value = [date.getFullYear(),
    ("" + (date.getMonth() + 1)).padStart(2, "0"),
    ("" + (date.getDate())).padStart(2, "0"),
    ].join('-')

    checkboxEnd.checked = dateFin.valueOf() != 0

    if (checkboxEnd.checked) {
        dayEnd.value = [
            dateFin.getFullYear(),
            ("" + (dateFin.getMonth() + 1)).padStart(2, "0"),
            ("" + (dateFin.getDate())).padStart(2, "0"),
        ].join('-')

        heureEnd.value = ("" + dateFin.getHours()).padStart(2, "0") + ":" + ("" + dateFin.getMinutes()).padStart(2, "0")
    } else {
        dayEnd.value = ""
        heureEnd.value = ""
    }


    document.getElementById("modalValider").onclick = () => {
        if (formValidate()) {
            let date = new Date(modalDay.value)
            date.setHours(...heure.value.split(":"))

            fetch("/event/edit/" + rdv._id, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: titre.value, date: date, endDate: checkboxEnd.checked ? new Date("" + dayEnd.value + " " + heureEnd.value) : null, place: lieux.value, description: description.value })
            }).then(modal.hide())
        }
    }

    modal.show()
}

function formValidate() {
    let errorTitre = document.getElementById("titreError")
    let errorHeure = document.getElementById("heureError")
    let errorFin = document.getElementById("dateFinError")

    let error = 0

    if (titre.value.length == 0) {
        errorTitre.innerHTML = "Le titre ne doit pas être vide"
        errorTitre.classList.remove("d-none")
        error++
    }
    else {
        errorTitre.classList.add("d-none")
    }

    if (heure.value.length == 0) {
        errorHeure.innerHTML = "L'heure ne doit pas être vide"
        errorHeure.classList.remove("d-none")
        error++
    }
    else {
        errorHeure.classList.add("d-none")
    }

    if (checkboxEnd.checked) {
        if (!heureEnd.value.length || !dayEnd.value.length || (new Date(modalDay.value + " " + heure.value).valueOf() > new Date(dayEnd.value + " " + heureEnd.value).valueOf())) {
            errorFin.innerHTML = "La date de fin est antérieur à celle de début"
            errorFin.classList.remove("d-none")
            error++
        } else {
            errorFin.classList.add("d-none")
        }
    }

    return error == 0
}

constructCalandar("calendar")

