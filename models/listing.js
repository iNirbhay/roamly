const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {type : String, required: true},
    description: String,
    image: {
        url: String,
        filename: String
    },
    images: Schema.Types.Mixed,
    price: Number,
    location: String,
    country: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }       
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual ownerId
listingSchema.virtual("ownerId").get(function () {
    if (!this.owner) return null;
    return this.owner._id ? this.owner._id.toString() : this.owner.toString();
}).set(function (val) {
    this.owner = val;
});

// Robust Image Resolver
listingSchema.virtual("imageUrl").get(function () {
    // 1. listing.image.url if available
    if (this.image && typeof this.image.url === "string" && this.image.url.trim() !== "") {
        return this.image.url.trim();
    }
    // 2. listing.image if it is a string
    if (typeof this.image === "string" && this.image.trim() !== "") {
        return this.image.trim();
    }
    // 3. listing.images if it is a string
    if (typeof this.images === "string" && this.images.trim() !== "") {
        return this.images.trim();
    }
    // 4. listing.images[0] if it is an array
    if (Array.isArray(this.images) && this.images.length > 0) {
        const first = this.images[0];
        if (typeof first === "string" && first.trim() !== "") return first.trim();
        if (first && typeof first.url === "string" && first.url.trim() !== "") return first.url.trim();
    }
    // 5. fallback image only if none of the above exists
    return "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80";
});

listingSchema.post("findOneAndDelete", async(listing) => {
    if (listing) {
        await Review.deleteMany({_id: {$in: listing.reviews}});
    }
});

const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);
module.exports = Listing;
module.exports.Property = Listing;
