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
            modal.classList.remove("open")
        }
    }

    modal.classList.add("open")
}