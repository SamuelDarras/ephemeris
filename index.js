import mongoose, { isValidObjectId, now } from "mongoose"
import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import env from "dotenv"
import jwt from "jsonwebtoken"
import fs from "fs"
import yaml from "js-yaml"
import cookieParser from 'cookie-parser'
import swaggerUi from "swagger-ui-express"
import expressWs from "express-ws"

import { EventEmitter } from "node:events"

import { RendezVous, User } from "./models.js"

mongoose.connect('mongodb+srv://dbUser:dbUserPassword@cluster0.fvrfwzh.mongodb.net/ephemeris?retryWrites=true&w=majority').then().catch(console.log)
env.config()

let evtEmitter = new EventEmitter()

const app = express()
app.use(cors({
    origin: '*'
}))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())

const swaggerDocument = yaml.load(fs.readFileSync('./swagger.yml', 'utf8'))


function verifyJwt(req, res) {
    if (req.headers && req.headers.authorization) {
        try {
            return jwt.verify(req.headers.authorization, process.env.JWT_SECRET_KEY)
        } catch (e) {
        }
    } else if (req.cookies.ephemeris_jwt) {
        try {
            return jwt.verify(req.cookies.ephemeris_jwt, process.env.JWT_SECRET_KEY)
        } catch (e) {
        }
    }

    sendError(res, UNAUTHORIZED)
    return null
}

async function checkConnected(req, res, ok, ko = () => { }) {
    let data = verifyJwt(req, res)
    if (data) {
        let user = await User.findById(data.userId)
        ok(user)
    } else {
        ko()
    }
}

const BAD_REQUEST = 400
const UNAUTHORIZED = 401
const RESSOURCE_NOT_FOUND = 404
function sendError(res, code, err = "") {
    let map = {
        [BAD_REQUEST]: "Bad request",
        [UNAUTHORIZED]: "Unauthorized",
        [RESSOURCE_NOT_FOUND]: "Ressource not found",
    }
    res.status(code).json({
        message: map[code],
        err: err
    })
}

app.post("/connect/", (req, res) => {
    User.findOne().where({ name: req.body.name, password: req.body.password }).exec((err, user) => {
        if (user === null) {
            sendError(res, BAD_REQUEST, {
                title: "Bad request",
                body: "incorrect name or password"
            })
        } else {
            let jwtSecretKey = process.env.JWT_SECRET_KEY
            let data = {
                time: Date(),
                userId: user._id
            }
            const token = jwt.sign(data, jwtSecretKey)

            let now = new Date();
            let time = now.getTime();
            let expireTime = time + 1000*36000;
            now.setTime(expireTime);

            res.setHeader("Set-Cookie", "ephemeris_jwt="+token + ";expires="+now.toUTCString()+";path=/")
            res.json({
                user: user.name,
                token: token,
                actions: [
                    { link: `/event/create`, method: "post" },
                ]
            })
        }
    })
})

app.post("/event/create/", async (req, res) => {
    checkConnected(req, res, async (user) => {
        let rdv = new RendezVous({
            title: req.body.title,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            place: req.body.place,
            description: req.body.description,
            owner: user._id
        })

        try {
            await rdv.save()
        } catch (err) {
            sendError(res, BAD_REQUEST, err.errors)
            return
        }
        evtEmitter.emit("create", rdv)
        res.status(200).json({
            rdv: rdv,
            actions: [
                { link: `/event/get/${rdv._id}`, method: "get" },
                { link: `/event/edit/${rdv._id}`, method: "post" },
                { link: `/event/delete/${rdv._id}`, method: "delete" }
            ]
        })
    })
})

app.get("/event/get/:id", async (req, res) => {
    checkConnected(req, res, async (user) => {
        if (!isValidObjectId(req.params.id)) {
            sendError(res, BAD_REQUEST)
            return
        }

        let rdv = await RendezVous.findById(req.params.id)
        if (!rdv) {
            sendError(res, RESSOURCE_NOT_FOUND)
            return
        }
        if (rdv.owner._id.equals(user._id)) {
            res.status(200).json({
                rdv: rdv,
                actions: [
                    { link: `/event/edit/${rdv._id}`, method: "post" },
                    { link: `/event/delete/${rdv._id}`, method: "delete" }
                ]
            })
        } else {
            sendError(res, UNAUTHORIZED)
        }

    })
})

app.get("/event/get-month/:year/:month", async (req, res) => {
    checkConnected(req, res, async (user) => {
        if (!req.params.year || !req.params.month) {
            sendError(res, BAD_REQUEST)
            return
        }

        let debutMois;
        let finMois;

        debutMois = new Date(req.params.year, 1*req.params.month-1, 1)
        finMois = new Date(req.params.year, 1*req.params.month, 1)

        if(isNaN(debutMois)){
            sendError(res, BAD_REQUEST, "Date mal form??e")
            return
        }

        let rdvs = await RendezVous.find({
            $or: [
                { $and: [
                    {startDate: { $gt: debutMois, }},
                    {startDate: { $lt: finMois, }},
                    ]
                },
                { $and: [
                    {startDate: { $lt: debutMois, }},
                    {endDate: { $gt: finMois, }},
                    ]
                },
                { $and: [
                    {endDate: { $gt: debutMois, }},
                    {endDate: { $lt: finMois, }},
                    ]
                },
            ],
            owner: user
        })

        res.status(200).json({
            rdvs: rdvs,
            actions: rdvs.map(rdv => {
                return [
                    { link: `/event/edit/${rdv._id}`, method: "post" },
                    { link: `/event/delete/${rdv._id}`, method: "delete" }
                ]
            })
        })
    })
})

app.get("/event/get-week/:year/:week", async (req, res) => {
    checkConnected(req, res, async (user) => {
        if (!req.params.year || !req.params.week) {
            sendError(res, BAD_REQUEST)
            return
        }

        let debutAnnee = new Date(req.params.year)
        let debutSemaine = new Date(debutAnnee.valueOf() + (req.params.week) * 604800000 - (debutAnnee.getDay()-1) * 86400000);
        let finSemaine = new Date(debutSemaine.getFullYear(), debutSemaine.getMonth(), debutSemaine.getDate() + 7);

        if(isNaN(debutSemaine)){
            sendError(res, BAD_REQUEST, "Date mal form??e")
            return
        }

        let rdvs = await RendezVous.find({
            $or: [
                { $and: [
                    {startDate: { $gt: debutSemaine, }},
                    {startDate: { $lt: finSemaine, }},
                    ]
                },
                { $and: [
                    {startDate: { $lt: debutSemaine, }},
                    {endDate: { $gt: finSemaine, }},
                    ]
                },
                { $and: [
                    {endDate: { $gt: debutSemaine, }},
                    {endDate: { $lt: finSemaine, }},
                    ]
                },
            ],
            owner: user
        })

        res.status(200).json({
            rdvs: rdvs,
            actions: rdvs.map(rdv => {
                return [
                    { link: `/event/edit/${rdv._id}`, method: "post" },
                    { link: `/event/delete/${rdv._id}`, method: "delete" }
                ]
            })
        })
    })
})

app.get("/event/get-day/:year/:month/:day", async (req, res) => {
    checkConnected(req, res, async (user) => {
        if (!req.params.year || !req.params.month || !req.params.day) {
            sendError(res, BAD_REQUEST)
            return
        }

        let debutJour = new Date(req.params.year, 1*req.params.month-1, req.params.day);
        let finJour = new Date(req.params.year, 1*req.params.month-1, 1*req.params.day+1);

        if(isNaN(debutJour)){
            sendError(res, BAD_REQUEST, "Date mal form??e")
            return
        }

        let rdvs = await RendezVous.find({
            $or: [
                { $and: [
                    {startDate: { $gt: debutJour, }},
                    {startDate: { $lt: finJour, }},
                    ]
                },
                { $and: [
                    {startDate: { $lt: debutJour, }},
                    {endDate: { $gt: finJour, }},
                    ]
                },
                { $and: [
                    {endDate: { $gt: debutJour, }},
                    {endDate: { $lt: finJour, }},
                    ]
                },
            ],
            owner: user
        })
        
        res.status(200).json({
            rdvs: rdvs,
            actions: rdvs.map(rdv => {
                return [
                    { link: `/event/edit/${rdv._id}`, method: "post" },
                    { link: `/event/delete/${rdv._id}`, method: "delete" }
                ]
            })
        })
    })
})

app.post("/event/edit/:id", async (req, res) => {
    checkConnected(req, res, async (user) => {
        if (!isValidObjectId(req.params.id)) {
            sendError(res, BAD_REQUEST)
            return
        }
        let rdv = await RendezVous.findById(req.params.id)
        if (!rdv) {
            sendError(res, RESSOURCE_NOT_FOUND)
            return
        }
        if (!user._id.equals(rdv.owner._id)) {
            sendError(res, UNAUTHORIZED)
            return
        }

        RendezVous.findByIdAndUpdate({ _id: req.params.id }, {$set: req.body}, { runValidators: true, new: true }, (err, rdvUpdated) => {
            if (err) {
                sendError(res, BAD_REQUEST, err)
                return
            }

            evtEmitter.emit("edit", rdvUpdated)
            res.status(200).json({
                rdv: rdvUpdated,
                actions: [
                    { link: `/event/get/${rdv._id}`, method: "get" },
                    { link: `/event/delete/${rdv._id}`, method: "delete" }
                ]
            })
        })
    })
})

app.delete("/event/delete/:id", async (req, res) => {
    checkConnected(req, res, async (user) => {
        if (!isValidObjectId(req.params.id)) {
            sendError(res, BAD_REQUEST)
            return
        }
        let rdv = await RendezVous.findById(req.params.id)
        if (!rdv) {
            sendError(res, RESSOURCE_NOT_FOUND)
            return
        }
        if (!rdv.owner._id.equals(user._id)) {
            sendError(res, UNAUTHORIZED)
            return
        }

        evtEmitter.emit("delete", rdv)
        await rdv.delete()              //!Attention si changement de la bdd
        res.status(200).json({
            actions: [
                { link: `/event/create/`, method: "post" }
            ]
        })
    })
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

//bind repository for client view
app.use(express.static("public"))



// Set up a headless websocket server that prints any
// events that come in.
expressWs(app)
app.ws("/ws", (ws, req) => {
    evtEmitter.on("create", evt => {
        ws.send(JSON.stringify({ action: "create", rdv: evt }))
    })
    evtEmitter.on("edit", evt => {
        ws.send(JSON.stringify({ action: "edit", rdv: evt }))
    })
    evtEmitter.on("delete", evt => {
        ws.send(JSON.stringify({ action: "delete", rdv: evt }))
    })
})

app.listen(3000, () => { console.log("serveur lance") })