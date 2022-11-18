const modal = new bootstrap.Modal(document.getElementById('myModal'))
const modalDateStart = document.getElementById("modalDateStart")
const titre = document.getElementById("titre")
const modalTimeStart = document.getElementById("modalTimeStart")
const lieux = document.getElementById("lieux")
const description = document.getElementById("description")
const modalDateEnd = document.getElementById("modalDateEnd")
const modalTimeEnd = document.getElementById("modalTimeEnd")

document.getElementById('myModal').addEventListener("hidden.bs.modal", () => {
    document.getElementById("modalForm").reset()
})



let mapRdvs = {}

async function constructCalandar(id) {
    let calandar = document.getElementById(id)

    let now = new Date(Date.now())
    let offsetMonth = new Date(now.getFullYear(), now.getMonth()).getDay()


    let res = { rdvs: [], actions: [] }
    for (let i = -1; i < 2; i++) {
        let r =  await (await fetch(`/event/get-month/${now.getFullYear()}/${now.getMonth() + i}`, {
            credentials: 'same-origin'
        })).json()
        res.rdvs = res.rdvs.concat(r.rdvs)
        res.actions = res.actions.concat(r.action)
    }


    let dates = []
    for (let i = 0; i < 42; i++) {
        let curDate = new Date(now.getFullYear(), now.getMonth(), i - offsetMonth + 2)
        let rdvs = res.rdvs.filter((v) => {
            mapRdvs[v._id] = v
            return new Date(v.startDate).toDateString() == curDate.toDateString() || new Date(v.endDate).toDateString() == curDate.toDateString()
        }).map(rdv => {
            let ending = "none"
            let startDateString = new Date(rdv.startDate).toDateString()
            let endDateString = new Date(rdv.endDate).toDateString()
            let curDateString = curDate.toDateString()
            if(startDateString != endDateString){
                if(curDateString == startDateString){
                    ending = "debut"
                }
                else{
                    ending = "fin"
                }
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
            if (curDate.date.getMonth() != now.getMonth()) {
                cell.classList.add("cell-disabled")
            }

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
                if (new Date(rdvA.startDate).getTime() > new Date(rdvB.startDate).getTime()) {
                    return 1
                } else if (new Date(rdvA.startDate).getTime() < new Date(rdvB.startDate).getTime()) {
                    return -1
                } else {
                    return 0
                }
            })) {
                let dateExacte = new Date(rdv.startDate)
                console.log(rdv)
                div.innerHTML += `\
                    <p class="${rdv.ending == 'none' ? '' : rdv.ending} cell-elem " onclick="handleClickOnRendezVous(event, '${rdv._id}')">${dateExacte.getHours().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })}:${dateExacte.getMinutes().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })} - ${rdv.title}</p>\
                `
            }
        }
    }
}

function handleClickOnDay(event, date) {
    document.getElementById("addRDVLabel").innerHTML = "Ajouter un rendez-vous le"
    modalDateStart.value = [date.getFullYear(),
    ("" + (date.getMonth() + 1)).length == 2 ? "" + (date.getMonth() + 1) : "0" + (date.getMonth() + 1),
    ("" + date.getDate()).length == 2 ? "" + date.getDate() : "0" + date.getDate()
    ].join('-')



    document.getElementById("modalValider").onclick = () => {
        if (formValidate()) {
            console.log(modalDateStart.value + " "+ modalTimeStart.value)
            console.log(modalDateEnd.value + " "+ modalTimeEnd.value)
            let date = new Date(modalDateStart.value)
            date.setHours(...modalTimeStart.value.split(":"))

            fetch("/event/create/", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: titre.value, startDate: date, endDate: new Date("" + modalDateEnd.value + " " + modalTimeEnd.value), place: lieux.value, description: description.value })
            }).then(modal.hide())
        }
    }

    modal.show()
}

function handleClickOnRendezVous(event, rdvId) {
    event.stopPropagation()
    document.getElementById("addRDVLabel").innerHTML = "Rendez-vous le"

    let rdv = mapRdvs[rdvId]
    let dateStart = new Date(rdv.startDate)
    let dateEnd = new Date(rdv.endDate)

    titre.value = rdv.title
    modalTimeStart.value = ("" + dateStart.getHours()).padStart(2, "0") + ":" + ("" + dateStart.getMinutes()).padStart(2, "0")
    lieux.value = rdv.place
    description.value = rdv.description

    modalDateStart.value = [dateStart.getFullYear(),
    ("" + (dateStart.getMonth() + 1)).padStart(2, "0"),
    ("" + (dateStart.getDate())).padStart(2, "0"),
    ].join('-')

    modalDateEnd.value = [
        dateEnd.getFullYear(),
        ("" + (dateEnd.getMonth() + 1)).padStart(2, "0"),
        ("" + (dateEnd.getDate())).padStart(2, "0"),
    ].join('-')

    modalTimeEnd.value = ("" + dateEnd.getHours()).padStart(2, "0") + ":" + ("" + dateEnd.getMinutes()).padStart(2, "0")



    document.getElementById("modalValider").onclick = () => {
        if (formValidate()) {
            let date = new Date(modalDateStart.value)
            date.setHours(...modalTimeStart.value.split(":"))

            fetch("/event/edit/" + rdv._id, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: titre.value, startDate: date, endDate: new Date("" + modalDateEnd.value + " " + modalTimeEnd.value), place: lieux.value, description: description.value })
            }).then(modal.hide())
        }
    }

    document.getElementById('modalSupprimer').onclick = () => {
        let confirmAction = confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")
        if (confirmAction) {
            fetch("event/delete/" + rdv._id, {
                method: "DELETE",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(modal.hide())
        }

    }

    modal.show()
}

function formValidate() {
    let errorTitre = document.getElementById("titreError")
    let errorHeure = document.getElementById("modalTimeStartError")
    let errorFin = document.getElementById("modalFinError")

    let error = 0

    if (titre.value.length == 0) {
        errorTitre.innerHTML = "Le titre ne doit pas être vide"
        errorTitre.classList.remove("d-none")
        error++
    }
    else {
        errorTitre.classList.add("d-none")
    }

    if (modalTimeEnd.value.length == 0) {
        errorHeure.innerHTML = "L'heure ne doit pas être vide"
        errorHeure.classList.remove("d-none")
        error++
    }
    else {
        errorHeure.classList.add("d-none")
    }

    if (!modalTimeEnd.value.length || !modalDateEnd.value.length || (new Date(modalDateStart.value + " " + modalTimeStart.value).valueOf() > new Date(modalDateEnd.value + " " + modalTimeEnd.value).valueOf())) {
        errorFin.innerHTML = "La date de fin est antérieur à celle de début"
        errorFin.classList.remove("d-none")
        error++
    } else {
        errorFin.classList.add("d-none")
    }

    return error == 0
}

constructCalandar("calendar")

