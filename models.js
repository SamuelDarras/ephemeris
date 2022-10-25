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

export let RendezVous = mongoose.model("RendezVous", new Schema(
    {
        title: {type: String, required: [true, "Un titre est requis"]},
        date: { type: Date, default: Date.now },
        place: { type: String, default: "" },
        description: { type: String, default: "" },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required:[true, "Un utilisateur est requis"] }
    }
))