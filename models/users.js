const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
    name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true,
    },
    auth0Id: {
        type: String,
        sparse: true,
        unique: true,
    },
    displayName: {
        type: String,
        trim: true,
    },
    avatar: {
        type: String,
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'auth0'],
        default: 'local',
    },
    role: {
        type: String,
        enum: ['user', 'host', 'admin'],
        default: 'user',
        required: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

userSchema.virtual('fullName').get(function () {
    return this.name || this.displayName || this.username || 'Traveler';
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
