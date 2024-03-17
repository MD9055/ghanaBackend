const mongoose = require('mongoose')

const signatureModel = new mongoose.Schema({

    signatureContent: {
        type: String,
        required: true
    },
    Id: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        required: false,
    },
    modifiedAt: {
        type: Date,
        required: false,
    },
});

const Signature = mongoose.model('Signature', signatureModel)
module.exports = Signature