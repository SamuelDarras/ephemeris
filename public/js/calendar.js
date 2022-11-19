import { openModal, closeModal } from "./modal.js"

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
        for (let day of ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]) {
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
            openModal({ date: date }, "Créer un événement")
        }

        this.rendezVous = null
    }

    addRendezVous(rdv, end, callback) { // TODO: ajouter des rdv sans rien pour alligner les autres (ex: toto 2)
        let rdvElem = document.createElement("p")
        rdvElem.classList.add("rendez-vous")

        rdvElem.classList.add(end)

        rdvElem.innerHTML = `${rdv.title}`

        rdvElem.onclick = callback

        this.cell.append(rdvElem)

        this.rendezVous = rdv
        rdvElem.addEventListener("mouseenter", () => {
            rdv.hover(true)
        })
        rdvElem.addEventListener("mouseleave", () => {
            rdv.hover(false)
        })

        return rdvElem
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
        this.shards = []
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
            let shard = cell.addRendezVous(this, end, (e) => {
                e.stopPropagation()
                openModal(this, "Modifier l'événement")
            })
            this.shards.push(shard)
        }
    }

    hover(status) {
        for (let shard of this.shards) {
            if (status) {
                shard.classList.add("hover")
            } else {
                shard.classList.remove("hover")
            }
        }
    }

    update(newData) {
        let newThis = {}

        for (let change of Object.keys(newData).map(entry => {
            let newEntry = newData[entry]
            let thisEntry = this[entry]
            if (entry.includes("Date")) {
                newEntry = new Date(newEntry)
                newEntry.setHours(newEntry.getHours()+1)

                thisEntry = new Date(thisEntry)
                thisEntry.setHours(thisEntry.getHours()+1)

                newEntry = newEntry.getTime()
                thisEntry = thisEntry.getTime()
            }
            return [thisEntry, newEntry, entry]
        }).filter(e => e[0] != e[1])) {
            if (change[0] != change[1]) {
                if (change[2].includes("Date")) {
                    this[change[2]] = new Date(change[1])
                    newThis[change[2]] = new Date(change[1])
                } else {
                    this[change[2]] = change[1]
                    newThis[change[2]] = change[1]
                }
            }
        }

        if (validate(newThis) && Object.keys(newThis).length) {
            fetch(`/event/edit/${this._id}`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newThis)
            }).then(() => {
                closeModal()
            }).catch(console.error)
        }
    }

    validate(newData) {
        return true
    }
}