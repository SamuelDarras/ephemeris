import { openModal, closeModal } from "./modal.js";

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
        for (let cell of this.cells) {
            let end = "middle"
            let startDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate())
            let endDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate())
            if (!(startDate - endDate)) {
                end = "none"
            } else if (!(cell.date - startDate)) {
                end = "start"
            } else if (!(cell.date - endDate)) {
                end = "end"
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
