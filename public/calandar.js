const modal = new bootstrap.Modal(document.getElementById('myModal'))


async function constructCalandar(id) {
    let calandar = document.getElementById(id)

    let now = new Date("10/10/2022")
    let offsetMonth = new Date(now.getFullYear(), now.getMonth()).getDay()


    let res = await fetch(`/event/getMonth/${now.getFullYear()}/${now.getDate()}`, {
        credentials: 'same-origin'
    })
    res = await res.json()
    let dates = []
    for (let i = 0; i < 42; i++) {
        let curDate = new Date(now.getFullYear(), now.getMonth() + 1, i - offsetMonth + 2)
        let rdvs = res.rdvs.filter((v) => new Date(v.date).toDateString() == curDate.toDateString())
        dates.push({
            date: curDate,
            rdvs: rdvs
        })
    }

    for (let i = 0; i < 6; i++) {
        let row = calandar.insertRow()
        for (let j = 0; j < 7; j++) {
            let curDate = dates[i * 7 + j]

            let cell = row.insertCell()
            let div = document.createElement("div")
            cell.appendChild(div)
            div.ondblclick = () => handleClickOnDay(curDate.date)
            div.innerHTML = `\
            ${curDate.date.toDateString().split(' ')[2]}\
            <br>\
            `

            for (let rdv of curDate.rdvs.sort((rdvA, rdvB) => {
                if (new Date(rdvA.date).getTime() > new Date(rdvB.date).getTime()) {
                    return 1
                } else if (new Date(rdvA.date).getTime() < new Date(rdvB.date).getTime()) {
                    return -1
                } else {
                    return 0
                }
            })) {
                let dateExacte = new Date(rdv.date)
                div.innerHTML += `\
                    <button class="btn btn-success">${dateExacte.getHours().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })}:${dateExacte.getMinutes().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })} - ${rdv.title}</button>\
                    <br>
                    <br>
                `
            }
            // div.classList.add("")
        }
    }
}

function handleClickOnDay(date) {
    modal.show()

}

constructCalandar("calandar")

