import { Cell } from "./cell.js";
import { RendezVous } from "./rendez_vous.js";



export class Calendar {
    static monthTab = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"]

    constructor(id) {
        this.id = id
        this.element = document.getElementById(this.id)
        this.displayedMonth = new Date()
        
        this.rdvs = []
    }

    _buildHeaders() {
        let month = document.createElement("div")
        month.innerHTML = Calendar.monthTab[this.displayedMonth.getMonth()] + " " + this.displayedMonth.getFullYear()
        
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

        rdvs.forEach(r => this.addRendezVous(r))
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

    change(sens, n){
        if (sens === "add"){
            this.displayedMonth.setMonth(this.displayedMonth.getMonth() + n).toLocaleString()
        }
        else{
            this.displayedMonth.setMonth(this.displayedMonth.getMonth() - n).toLocaleString()
        }

        this._build()
    }

    changeDate(value){
        let newDate = new Date(value);

        if(newDate.getMonth() === this.displayedMonth.getMonth()) return
        this.displayedMonth.setFullYear(newDate.getFullYear());
        this.displayedMonth.setMonth(newDate.getMonth());

        this._build();
    }

    _build() {
        this.cells = []
        this.element.replaceChildren()
        this._buildHeaders()
        this._buildContent()
        this._queryMonth()
    }

    show(date) {
        this.displayedMonth = date
        this._build()
        this.element.style["display"] = ""
    }
    hide() {
        this.element.style["display"] = "none"
        return this.displayedMonth
    }
}
