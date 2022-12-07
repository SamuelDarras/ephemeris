import { RendezVous } from "./rendez_vous.js"
import { Cell } from "./cell.js"

export class Week {
    static monthTab = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"]

    constructor(id) {
        this.id = id
        this.element = document.getElementById(this.id)

        this.debutSemaine = new Date()

        this.debutSemaine.setDate(this.debutSemaine.getDate() - this.debutSemaine.getDay() + 1)

        this.rdvs = []
    }

    _buildHeaders() {
        let month = document.createElement("div")
        month.innerHTML = Week.monthTab[this.debutSemaine.getMonth()] + " " + this.debutSemaine.getFullYear()

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
        container.classList.add("content")

        let offset = this.debutSemaine.getDay() - 1
        if (offset < 0) {
            offset += 7
        }

        for (let i = 0; i < 7; i++) {
            let date = new Date(this.debutSemaine.getFullYear(), this.debutSemaine.getMonth(), this.debutSemaine.getDate() + i - offset)
            let content = document.createElement("div")
            content.innerHTML = `${date.getDate()}`

            let cell = new Cell(date, container, content)
            this.cells.push(cell)
        }
        this.element.append(container)
    }

    async _queryWeek() {
        let dateDebutAnnee = new Date(this.debutSemaine.getFullYear(), 0, 1)
        let displayedWeek = 1 + Math.floor((this.debutSemaine - dateDebutAnnee) / (7 * 24 * 60 * 60 * 1000))
        let weekBefore = await (await fetch(`/event/get-week/${this.debutSemaine.getFullYear()}/${displayedWeek-1}`)).json()
        let weekCurrent = await (await fetch(`/event/get-week/${this.debutSemaine.getFullYear()}/${displayedWeek}`)).json()
        let weekAfter = await (await fetch(`/event/get-week/${this.debutSemaine.getFullYear()}/${displayedWeek+1}`)).json()

        let rdvs = [].concat(weekBefore.rdvs, weekCurrent.rdvs, weekAfter.rdvs)
        rdvs.filter(() => {
            let acc = []
            return rdv => {
                if (acc.includes(rdv._id)) {
                    return false
                }
                acc.push(rdv._id)
                return true
            }
        })

        weekCurrent.rdvs.forEach(r => this.addRendezVous(r))
    }

    addRendezVous(rdv) {
        let newRdv = new RendezVous(rdv._id, rdv.title, new Date(rdv.startDate), new Date(rdv.endDate), rdv.place, rdv.description)
        let elems = Cell.associateToRdv(this.cells, newRdv)
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

    change(sens) {
        if (sens === "add") {
            this.debutSemaine.setDate(this.debutSemaine.getDate() + 7)
        }
        else {
            this.debutSemaine.setDate(this.debutSemaine.getDate() - 7)
        }
        this._build()
    }

    _build() {
        this.cells = []
        this.element.replaceChildren()

        this._buildHeaders()
        this._buildContent()
        this._queryWeek()
    }

    show(date) {
        this.debutSemaine = new Date(date.getFullYear(), date.getMonth())
        this._build()
        this.element.style["display"] = ""
    }
    hide() {
        this.element.style["display"] = "none"
        return this.debutSemaine
    }
}