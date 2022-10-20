import mongoose, { Schema } from "mongoose"

export let User = mongoose.model("User", new Schema(
    {
        name: String,
        password: String,
    }, {
    query: {
        byName(name) {
            return this.where({ name: new RegExp(name, 'i') })
        }
    }
})
)

export let RendezVous = mongoose.model("RendezVous", {
    title: String,
    date: { type: Date, default: Date.now },
    place: String,
    description: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
})