async function constructCalandar(id) {
    let calandar = document.getElementById(id)

    let now = new Date("10/10/2022")
    let offsetMonth = new Date(now.getFullYear(), now.getMonth()).getDay()


    let rdvs = await fetch(`/event/getMonth/${now.getFullYear()}/${now.getDate()}`, {
        credentials: 'same-origin'
    })
    rdvs = await rdvs.json()
    let dates = []
    for (let i = 0; i < 42; i++) {
        let curDate = new Date(now.getFullYear(), now.getMonth() + 1, i - offsetMonth + 2)
        let rdv = rdvs.rdvs.filter((v) => new Date(v.date).toDateString() == curDate.toDateString())
        dates.push({
            date: curDate,
            rdv: rdv
        })
    }


    for (let i = 0; i < 6; i++) {
        let row = calandar.insertRow()
        for (let j = 0; j < 7; j++) {
            let curDate = dates[i * 7 + j]

            let cell = row.insertCell()
            let div = document.createElement("div")
            cell.appendChild(div)
            div.onclick = () => handleClickOnDay(curDate.date)
            div.innerHTML = `\
            ${curDate.date.toDateString().split(' ')[2]}\
            <br>\
            `

            for (let rdv of curDate.rdv) {
                div.innerHTML += `\
                    <button class="btn btn-success">${rdv.title}</button>\
                    <br>
                    <br>
                `
            }
            // div.classList.add("")
        }
    }
}

function handleClickOnDay(date) {
    alert(date)
}

constructCalandar("calandar")