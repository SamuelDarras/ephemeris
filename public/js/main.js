import { Calendar } from "./calendar.js"
import { Jour } from "./jour.js"
import { Week } from "./week.js"

let vues = [
    new Calendar("calendar"),
    new Week("week"),
    new Jour("day"),
]
vues.forEach(vue => vue.hide())
let c = vues[0]
c.show(new Date())


const btnMonthBefore = document.getElementById("btnMonthBefore")
const btnMonthAfter = document.getElementById("btnMonthAfter")

btnMonthBefore.addEventListener("click", evt => {c.change("sub")})
btnMonthAfter.addEventListener("click", evt => {c.change("add")})

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