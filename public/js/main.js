import { Calendar, RendezVous } from "./calendar.js"

let c = new Calendar("calendar")

const socket = new WebSocket("ws://"+location.host+"/ws")
socket.addEventListener("open", evt => {
    socket.send("hallo")
})
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