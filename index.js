import mongoose, { isValidObjectId } from "mongoose"
import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import env from "dotenv"
import jwt from "jsonwebtoken"
import fs from "fs"
import yaml from "js-yaml"

import swaggerUi from "swagger-ui-express"

import { RendezVous, User } from "./models.js"

mongoose.connect('mongodb+srv://dbUser:dbUserPassword@cluster0.fvrfwzh.mongodb.net/ephemeris?retryWrites=true&w=majority').then().catch(console.log)
env.config()

const app = express()
app.use(cors({
    origin: '*'
}));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const swaggerDocument = yaml.load(fs.readFileSync('./swagger.yml', 'utf8'))


function verifyJwt(req, res) {
    if (req.headers && req.headers.authorization) {
        try {
            return jwt.verify(req.headers.authorization, process.env.JWT_SECRET_KEY)
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

            res.json({
                user: user.name,
                token: token
            })
        }
    })
})

app.post("/event/create/", async (req, res) => {
    checkConnected(req, res, async (user) => {
        let rdv = new RendezVous({
            title: req.body.title,
            date: req.body.date,
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
        if (data.userId != rdv.owner._id) {
            sendError(res, UNAUTHORIZED)
            return
        }

        RendezVous.findByIdAndUpdate({ _id: req.params.id }, req.body, { runValidators: true }, (err, rdvUpdated) => {
            if (err) {
                sendError(res, BAD_REQUEST, err)
                return
            }

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

app.listen(3000, () => { console.log("serveur lance") })
