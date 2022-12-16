import { openModal, closeModal } from "./modal.js";
import { Calendar } from "./calendar.js"
import { Jour } from "./jour.js"
import { Week } from "./week.js"


let vues = [
    new Calendar("calendar"),
    new Week("week"),
    new Jour("day"),
]
vues.forEach(vue => vue.hide())
let c = vues[document.getElementById("select-view").value]
c.show(new Date())


const btnMonthBefore = document.getElementById("btnMonthBefore")
const btnMonthAfter = document.getElementById("btnMonthAfter")

const changeDatePicker = document.getElementById("changeDatePicker")
changeDatePicker.value = new Date().toISOString().substring(0, 10);

const btnCreateRendezVous = document.getElementById("createRendezVous")
btnCreateRendezVous.addEventListener("click", evt => {
    evt.stopPropagation()
    console.log(c.getStart())
    let startDate = new Date(c.getStart().getTime() + 1000*60*60*13)
    let endDate = new Date(startDate.getTime() + 1000*60*15)
    openModal({ title: "", startDate: startDate, endDate: endDate, place: "", description: "" }, "Créer un événement", null)
})

btnMonthBefore.addEventListener("click", evt => {c.change("sub", 1)})
btnMonthAfter.addEventListener("click", evt => {c.change("add", 1)})
changeDatePicker.addEventListener("change", evt => {c.changeDate(changeDatePicker.value)})

const socket = new WebSocket("ws://"+location.host+"/ws")

socket.addEventListener("message", evt => {
    let data = JSON.parse(evt.data)
    switch (data.action) {
        case "create":
            c.addRendezVous(data.rdv)
            break
        case "edit":
            c.updateRendezVous(data.rdv)
            break
        case "delete":
            c.deleteRendezVous(data.rdv)
            break
    }
})

document.getElementById("select-view").onchange = (evt) => {
    let date = c.hide()
    c = vues[evt.target.value]
    c.show(date)
}
