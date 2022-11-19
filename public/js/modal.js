export function openModal(data, title) {
    let modal = document.getElementById("modal")

    document.getElementById("modal-title").innerHTML = title

    for (let key in data) {
        let container = document.getElementById(key)

        if (container) {
            let value = data[key]
            if (value instanceof Date) {
                value = value.toISOString().slice(0, -1)
            }
            container.value = value.toString()
        }
    }

    let closes = document.getElementsByClassName("modal-close")
    for (let close of closes) {
        close.onclick = (evt) => {
            closeModal()
        }
    }

    let validate = document.getElementsByClassName("modal-validate")[0]
    validate.onclick = (evt) => {
        let newData = {}
        for (let key in data) {
            let container = document.getElementById(key)

            if (container) {
                newData[key] = container.value
            }
        }
        data.update(newData)
    }

    modal.classList.add("open")
}

export function closeModal() {
    let modal = document.getElementById("modal")
    modal.getElementsByTagName("form")[0].reset()
    modal.classList.remove("open")
}