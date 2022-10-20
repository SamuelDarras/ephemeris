import mongoose from "mongoose"
import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import env from "dotenv"
import jwt from "jsonwebtoken"

import { User } from "./models.js"

mongoose.connect('mongodb+srv://dbUser:dbUserPassword@cluster0.fvrfwzh.mongodb.net/ephemeris?retryWrites=true&w=majority').then().catch(console.log)
env.config()

const app = express()
app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

function verifyJwt(req, res) {
    if (req.headers && req.headers.authorization) {
        try {
            return jwt.verify(req.headers.authorization, process.env.JWT_SECRET_KEY)
        } catch (e) {
            return res.status(401).send("unauthorized")
        }
    }
}

app.post("/connect/", (req, res) => {
    User.findOne().where({ name: req.body.name, password: req.body.password }).exec((err, user) => {
        let jwtSecretKey = process.env.JWT_SECRET_KEY
        console.log(user)
        let data = {
            time: Date(),
            userId: user._id
        }
        const token = jwt.sign(data, jwtSecretKey)

        res.send(token)
    })
})

app.get("/test/", (req, res) => {
    let r = verifyJwt(req, res)
    console.log(r)
    res.send("Ok")
})

app.listen(3000)
