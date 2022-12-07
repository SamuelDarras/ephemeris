import { Calendar } from "./calendar.js";
import { Cell } from "./cell.js";
import { RendezVous } from "./rendez_vous.js";

export class Jour {
    constructor(id) {
        this.id = id
        this.element = document.getElementById(this.id)
        this.displayedDay = new Date()
        
        this.rdvs = []
    }

    _buildHeaders() {
        let header = document.createElement("div")
        header.classList.add("calendar-header")

        let date = document.createElement("div")
        let month = Calendar.monthTab[this.displayedDay.getMonth()]
        let day = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][(this.displayedDay.getDay()+6)%7]
        let dateNumber = this.displayedDay.getDate()

        date.innerHTML = `${day} ${dateNumber} ${month}`
        
        this.element.prepend(header)
        header.prepend(date)

        let hours = document.createElement("div")
        for (let i = 0; i < 24; i++) {
            let content = document.createElement("div")
            content.innerHTML = `${i}`

            hours.appendChild(content)
        }
        hours.style["display"] = "grid"
        hours.style["gridTemplateColumns"] = "repeat(24, 1fr)"
        hours.style["gridTemplateRows"] = "repeat(1, 1fr)"
        header.append(hours)
    }

    _buildContent() {
        let container = document.createElement("div")
        container.classList.add("content")

        this.element.append(container)

        this.content = container
    }

    async _queryDay() {
        let dayCurrent = await (await fetch(`/event/get-day/${this.displayedDay.getFullYear()}/${this.displayedDay.getMonth()+1}/${this.displayedDay.getDate()}`)).json()
        dayCurrent.rdvs.forEach(r => this.addRendezVous(r))
    }
    
    addRendezVous(rdv) {
        let newRdv = new RendezVous(rdv._id, rdv.title, new Date(rdv.startDate), new Date(rdv.endDate), rdv.place, rdv.description)
        let row = document.createElement("div")
        row.classList.add("day-row")

        let content = document.createElement("p")
        let elems = Cell.associateToRdv([new Cell(this.displayedDay, row, content)], newRdv)
        newRdv.cells = elems

        this.rdvs.push(newRdv)
        newRdv.build()
        
        let rdvElement = newRdv.cells[0].shards[newRdv._id]
        rdvElement.style["position"] = "relative"
        if (newRdv.startDate < this.displayedDay && newRdv.endDate.getDate() == this.displayedDay.getDate()) {
            rdvElement.style["width"] = (100/(24 * 1000*60*60))*(newRdv.endDate - this.displayedDay) + "%"
        } else if (newRdv.endDate > (this.displayedDay.valueOf() + (24*60*60*1000)) && newRdv.startDate.getDate() == this.displayedDay.getDate()) {
            let left = (100/24)*(newRdv.startDate - this.displayedDay)/(1000*60*60)
            rdvElement.style["left"] = left + "%"
            rdvElement.style["width"] = (100 - left) + "%"
        } else if (newRdv.startDate.getDate() == this.displayedDay.getDate() && this.displayedDay.getDate() == newRdv.endDate.getDate()) {
            let left = (100/24)*(newRdv.startDate - this.displayedDay)/(1000*60*60)
            rdvElement.style["left"] = left + "%"
            rdvElement.style["width"] = ((100/24)*(newRdv.endDate - newRdv.startDate)/(1000*60*60)) + "%"
        }
        
        this.content.appendChild(row)
    }

    updateRendezVous(rdv) {
        this.deleteRendezVous(rdv)
        this.addRendezVous(rdv)
    }

    deleteRendezVous(rdv) {
        let updatedRendezVous = this.rdvs.find(that => rdv._id == that._id)
        if (updatedRendezVous) {
            updatedRendezVous.cells[0].destroy()
            updatedRendezVous.destroy()
            this.rdvs = this.rdvs.filter(rdv => rdv._id != updatedRendezVous._id)
        }
        
    }

    _build() {
        this.cells = []
        this.element.replaceChildren()
        this._buildHeaders()
        this._buildContent()
        this._queryDay()
    }

    change(sens) {
        if (sens === "add"){
            this.displayedDay.setDate(this.displayedDay.getDate() + 1).toLocaleString()
        }
        else{
            this.displayedDay.setDate(this.displayedDay.getDate() - 1).toLocaleString()
        }

        this._build()
    }

    show(date) {
        this.displayedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0)
        this._build()
        this.element.style["display"] = ""
    }
    hide() {
        this.element.style["display"] = "none"
        return this.displayedDay
    }
}