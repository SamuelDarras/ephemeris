import mongoose, { isValidObjectId } from "mongoose"
import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import env from "dotenv"
import jwt from "jsonwebtoken"

import { RendezVous, User } from "./models.js"

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
        }
    }
    res.status(401).send("unauthorized")
    return null
}

app.post("/connect/", (req, res) => {
    User.findOne().where({ name: req.body.name, password: req.body.password }).exec((err, user) => {
        let jwtSecretKey = process.env.JWT_SECRET_KEY
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

app.post("/event/create/", async (req, res) => {
    let data = verifyJwt(req, res)
    if (data) {
        let user = await User.findById(data.userId)
        let rdv = new RendezVous({
            title: req.body.title,
            date: new Date(req.body.date),
            place: req.body.place,
            description: req.body.description,
            owner: user._id
        })

        try{
            await rdv.save()
        } catch(err){
            res.status(400).json(err)
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
    }
})

app.get("/event/get/:id", async (req, res) => {
    let data = verifyJwt(req, res)
    if (data) {
        if(!isValidObjectId(req.params.id)){
            res.status(400).send("bad request")
            return
        }
        let rdv = await RendezVous.findById(req.params.id)
        if(!rdv){
            res.status(404).send("ressource not found")
            return
        }
        if(data.userId == rdv.owner._id){
            res.status(200).json({
                rdv: rdv,
                actions: [
                    { link: `/event/edit/${rdv._id}`, method: "post" },
                    { link: `/event/delete/${rdv._id}`, method: "delete" }
                ]
            })
        }
        else{
            res.status(401).send("unauthorized")
        }
    }
})

app.post("/event/edit/:id", async (req, res) => {
    let data = verifyJwt(req, res)
    if (data){
        if(!isValidObjectId(req.params.id)){
            res.status(400).send("bad request")
            return
        }
        let rdv = await RendezVous.findById(req.params.id)
        if(!rdv){
            res.status(404).send("ressource not found")
            return
        }

        if(data.userId == rdv.owner._id){
            RendezVous.findByIdAndUpdate({_id: req.params.id}, req.body, {runValidators: true}, (err, rdvUpdated) => {
                if(err){
                    console.log(err)
                    res.status(400).send(err)
                }
                else{
                    res.status(200).json({
                        rdv: rdvUpdated,
                        actions: [
                            { link: `/event/get/${rdv._id}`, method: "get" },
                            { link: `/event/delete/${rdv._id}`, method: "delete" }
                        ]
                    })
                }
            })
        }
        else{
            res.status(401).send("unauthorized")
        }
    }
})

app.delete("/event/delete/:id", async (req, res) => {
    let data = verifyJwt(req, res)
    if (data){
        if(!isValidObjectId(req.params.id)){
            res.status(400).send("bad request")
            return
        }
        let rdv = await RendezVous.findById(req.params.id)
        if(!rdv){
            res.status(404).send("ressource not found")
            return
        }
        if(data.userId == rdv.owner._id){
            await rdv.delete()              //!Attention si changement de la bdd
            res.status(200).json({
                actions: [
                    { link: `/event/create/`, method: "post" }
                ]
            })
        }
        else{
            res.status(401).send("unauthorized")
        }
    }
})
app.listen(3000)
