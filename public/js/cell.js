import { openModal, closeModal } from "./modal.js";

function intervalContained(a1, b1, a2, b2) {
    return a2 < a1 && b2 > a1 || a2 > a1 && b2 < b1 || a2 < b1 && b2 > b1
}

export class Cell {
    constructor(date, parent, content) {
        this.date = date
        this.content = content
        this.parent = parent
        content.classList.add("cell-label")

        let cell = document.createElement("div")
        cell.classList.add("calendar-cell")
        parent.appendChild(cell)

        this.cell = cell
        this.cell.appendChild(this.content)

        let startDate = new Date(date.getTime() + 1000*60*60*13) 
        let endDate = new Date(startDate.getTime() + 1000*60*15)

        cell.onclick = (e) => {
            e.stopPropagation()
            openModal({ title: "", startDate: startDate, endDate: endDate, place: "", description: "" }, "Créer un événement", null)
        }

        this.shards = {}
    }

    addRendezVous(rdv, end, callback) { // TODO: ajouter des rdv sans rien pour alligner les autres (ex: toto 2)
        let rdvElem = document.createElement("p")
        rdvElem.classList.add("rendez-vous")

        rdvElem.classList.add(end)

        rdvElem.innerHTML = `${rdv.title}`

        rdvElem.onclick = callback

        this.cell.append(rdvElem)

        this.shards[rdv._id] = rdvElem
        rdvElem.addEventListener("mouseenter", () => {
            rdv.hover(true)
        })
        rdvElem.addEventListener("mouseleave", () => {
            rdv.hover(false)
        })

        return rdvElem
    }

    remove(rdv) {
        this.cell.removeChild(this.shards[rdv._id])
    }

    destroy() {
        this.parent.removeChild(this.cell)
    }

    static associateToRdv(cells, rdv) {
        let r = []
        for (let cell of cells) {
            let cellDayBeginning = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate())
            let cellDayEnding = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate() + 1)
            if (intervalContained(rdv.startDate.getTime(), rdv.endDate.getTime(), cellDayBeginning.getTime(), cellDayEnding.getTime())) {
                r.push(cell)
            }
        }

        return r
    }
}