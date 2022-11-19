import { openModal } from "./modal.js";

function associateCellToRdv(cells, rdv) {
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

function intervalContained(a1, b1, a2, b2) {
    return a2 < a1 && b2 > a1 || a2 > a1 && b2 < b1 || a2 < b1 && b2 > b1
}

export class Calendar {
    constructor(id) {
        this.id = id
        this.element = document.getElementById(this.id)

        this.rdvs = []
        this.cells = []
        this._buildContent()

        this._queryMonth().then(() => {
            this._buildHeaders()
            this.rdvs.forEach(rdv => rdv.build())
        })
    }

    _buildHeaders() {
        let header = document.createElement("div")
        header.classList.add("calendar-header")
        this.element.prepend(header)
        for (let day of ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Diamanche"]) {
            let cell = document.createElement("div")
            cell.classList.add("calendar-cell")
            cell.innerHTML = day

            header.append(cell)
        }
    }

    _buildContent() {
        let container = document.createElement("div")
        container.classList.add("calendar-content")

        let now = new Date()
        let offset = now.getDate() - (new Date(now.getFullYear(), now.getMonth()).getDate())

        for (let i = 0; i < 7 * 6; i++) {
            let date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset + i - 1)

            let content = document.createElement("div")
            content.innerHTML = `${date.getDate()}`

            let cell = new Cell(date, container, content)
            this.cells.push(cell)
        }
        this.element.append(container)
    }

    async _queryMonth() {
        let now = new Date()
        await fetch(`/event/get-month/${now.getFullYear()}/${now.getMonth() + 1}`).then(async res => {
            let rdvs = await res.json()
            rdvs.rdvs.forEach(r => {
                let newRdv = new RendezVous(r._id, r.title, new Date(r.startDate), new Date(r.endDate), r.place, r.description)
                let elems = associateCellToRdv(this.cells, newRdv)
                newRdv.cells = elems
                this.rdvs.push(newRdv)
            })
        })
    }
}

class Cell {
    constructor(date, parent, content) {
        this.date = date
        this.content = content
        content.classList.add("cell-label")

        let cell = document.createElement("div")
        cell.classList.add("calendar-cell")
        parent.appendChild(cell)

        this.cell = cell
        this.cell.appendChild(this.content)

        cell.onclick = (e) => {
            e.stopPropagation()
            openModal({date: date}, "Créer un événement")
        }
    }

    addRendezVous(rdv, end, callback) {
        let rdvElem = document.createElement("p")
        rdvElem.classList.add("rendez-vous")

        rdvElem.classList.add(end)

        rdvElem.innerHTML = `${rdv.title}`
        
        rdvElem.onclick = callback

        this.cell.append(rdvElem)
    }
}

class RendezVous {
    constructor(_id, title, startDate, endDate, place, description, owner, cells) {
        this._id = _id

        this.title = title
        this.startDate = startDate
        this.endDate = endDate
        this.place = place
        this.description = description
        this.owner = owner

        this.cells = cells
    }

    build() {
        for (let [idx, cell] of this.cells.entries()) {
            let end = "none"
            if (idx == 0 && this.cells.length != 1) {
                end = "start"
            } else if (idx == this.cells.length - 1 && this.cells.length != 1) {
                end = "end"
            } else if (this.cells.length > 2) {
                end = "middle"
            }
            cell.addRendezVous(this, end, (e) => {
                e.stopPropagation()
                openModal(this, "Modifier l'événement")
            })
        }
    }
}