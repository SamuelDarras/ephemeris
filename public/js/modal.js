export function openModal(data, title, rdv) {
    let modal = document.getElementById("modal")

    if(rdv != null){ //peut ptetre faire mieux
        let footer = document.getElementsByClassName("modal-footer")[0]
        let deleteButton = document.createElement("div")
        deleteButton.innerHTML = "Supprimer"
        deleteButton.classList.add("modal-delete", "btn", "btn-danger", "mx-2")
        deleteButton.onclick = () => {
            let confirmAction = confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")
            if (confirmAction) {
                fetch("event/delete/" + rdv._id, {
                    method: "DELETE",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                closeModal()
            }

        }
        footer.append(deleteButton)

    }

    document.getElementById("modal-title").innerHTML = title
    for (let key in data) {
        let value = data[key]
        if (value instanceof Date) {
           value = new Date(value.toString().split('GMT')[0]+' UTC').toISOString().split('.')[0] //moche mais voila
        }
        document.getElementById(key).value = value.toString()
    }

    let closes = document.getElementsByClassName("modal-close")
    for (let close of closes) {
        close.onclick = (evt) => {
            closeModal()
        }
    }
    console.log(data)

    let validateButton = document.getElementsByClassName("modal-validate")[0]
    validateButton.onclick = (evt) => {
        let newData = {}
        for (let key in data) {
            newData[key] = document.getElementById(key).value
        }

        if(validate(newData)){
            if(rdv != null){
                rdv.update(newData)
            }
            else{
                newData.startDate = new Date(newData.startDate)
                newData.endDate = new Date(newData.endDate)
                fetch("/event/create/", {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newData)
                })
                closeModal()
            }
        }
    }

    modal.classList.add("open")
}

export function closeModal() {
    let modal = document.getElementById("modal")
    modal.getElementsByTagName("form")[0].reset()
    Array.from(document.querySelectorAll('label[id$="Error"]')).forEach((el) => el.classList.add('d-none'));
    let deleteButton = document.getElementsByClassName("modal-delete")[0]
    if(deleteButton != undefined){
        deleteButton.remove()
    }

    modal.classList.remove("open")
}

function validate(datas) {
    let errorTitre = document.getElementById("modalTitreError")
    let errorEndDate = document.getElementById("modalEndDateError")
    let errorPlace = document.getElementById("modalPlaceError")
    let errorDescription = document.getElementById("modalDescriptionError")

    let error = 0

    if (datas.title.length == 0 || datas.title.length >= 256) {
        errorTitre.innerHTML = "Le titre ne doit pas être vide et ça taille doit être inférieur à 256 caractères"
        errorTitre.classList.remove("d-none")
        error++
    }
    else {
        errorTitre.classList.add("d-none")
    }

    if (new Date(datas.startDate).valueOf() > new Date(datas.endDate).valueOf()) {
        errorEndDate.innerHTML = "La date de fin est antérieur à celle de début"
        errorEndDate.classList.remove("d-none")
        error++
    } else {
        errorEndDate.classList.add("d-none")
    }

    if(datas.place != "" && datas.place.length >= 256){
        errorPlace.innerHTML = "La place doit être inférieur à 256 caractères"
        errorPlace.classList.remove("d-none")
        error++
    }
    else{
        errorPlace.classList.add("d-none")
    }

    if(datas.description != "" && datas.description.length >= 256){
        errorDescription.innerHTML = "La description doit être inférieur à 256 caractères"
        errorDescription.classList.remove("d-none")
        error++
    }
    else{
        errorDescription.classList.add("d-none")
    }

    return error == 0
}
