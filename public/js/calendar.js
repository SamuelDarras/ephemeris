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
    static monthTab = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"]

    constructor(id) {
        this.id = id
        this.element = document.getElementById(this.id)
        this.displayedMonth = new Date()
        
        this.rdvs = []
        this.cells = []
        this._buildHeaders()

        
        this._buildContent()
        this._queryMonth()
    }

    _buildHeaders() {

        let month = document.createElement("div")
        month.innerHTML = Calendar.monthTab[this.displayedMonth.getMonth()]
        
        let header = document.createElement("div")
        header.classList.add("calendar-header")
        
        this.element.prepend(header)
        for (let day of ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]) {
            let cell = document.createElement("div")
            cell.classList.add("calendar-cell")
            cell.innerHTML = day
            
            header.append(cell)
        }
        
        this.element.prepend(month)
    }

    _buildContent() {
        let container = document.createElement("div")
        container.classList.add("calendar-content")

        let now = new Date()
        let offset = this.displayedMonth.getDate() - (new Date(this.displayedMonth.getFullYear(), this.displayedMonth.getMonth()).getDate()) + this.displayedMonth.getDay() - 2
        if (offset < 0) {
            offset += 7
        }

        for (let i = 0; i < 7 * 6; i++) {
            let date = new Date(this.displayedMonth.getFullYear(), this.displayedMonth.getMonth(), this.displayedMonth.getDate() - offset + i - 1)
            let content = document.createElement("div")
            content.innerHTML = `${date.getDate()}`

            let cell = new Cell(date, container, content)
            this.cells.push(cell)
        }
        this.element.append(container)
    }

    async _queryMonth() {
        let monthBefore  = await (await fetch(`/event/get-month/${this.displayedMonth.getFullYear()}/${this.displayedMonth.getMonth()}`)).json()
        let monthCurrent = await (await fetch(`/event/get-month/${this.displayedMonth.getFullYear()}/${this.displayedMonth.getMonth() + 1}`)).json()
        let monthAfter   = await (await fetch(`/event/get-month/${this.displayedMonth.getFullYear()}/${this.displayedMonth.getMonth() + 2}`)).json()

        let rdvs = [].concat(monthBefore.rdvs, monthCurrent.rdvs, monthAfter.rdvs)
        rdvs = rdvs.reduce((acc, cur) => {
            if (acc[0].includes(cur._id)) {
                return acc
            } else {
                acc[0].push(cur._id)
                acc.push(cur)
                return acc
            }
        }, [[]]).slice(1, -1)

        rdvs.forEach(r => this.addRendezVous(r))
    }

    addRendezVous(rdv) {
        let newRdv = new RendezVous(rdv._id, rdv.title, new Date(rdv.startDate), new Date(rdv.endDate), rdv.place, rdv.description)
        let elems = associateCellToRdv(this.cells, newRdv)
        newRdv.cells = elems
        this.rdvs.push(newRdv)
        newRdv.build()
    }

    updateRendezVous(rdv) {
        this.deleteRendezVous(rdv)
        this.addRendezVous(rdv)
    }

    deleteRendezVous(rdv) {
        let updatedRendezVous = this.rdvs.find(that => rdv._id == that._id)
        if (updatedRendezVous) {
            updatedRendezVous.destroy()
            this.rdvs = this.rdvs.filter(rdv => rdv._id != updatedRendezVous._id)
        }
    }

    changeDisplayedMonth(sens){
        if (sens === "add"){
            this.displayedMonth.setMonth(this.displayedMonth.getMonth() + 1).toLocaleString()
        }
        else{
            this.displayedMonth.setMonth(this.displayedMonth.getMonth() - 1).toLocaleString()
        }

        this.cells = []
        this.element.replaceChildren()

        this._buildHeaders()
        this._buildContent()
        this._queryMonth()
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
}

export class RendezVous {
    constructor(_id, title, startDate, endDate, place, description, owner) {
        this._id = _id

        this.title = title
        this.startDate = startDate
        this.endDate = endDate
        this.place = place
        this.description = description
        this.owner = owner

        this.cells = []
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
                openModal({title: this.title, startDate: this.startDate, endDate: this.endDate, place: this.place, description: this.description}, "Modifier l'événement", this)
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

    destroy() {
        this.cells.forEach(cell => {
            cell.remove(this)
        })
    }
}

