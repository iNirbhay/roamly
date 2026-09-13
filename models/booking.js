const mongoose = require("mongoose");
const Schema = mongoose.Schema;

function generateBookingId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `ROAM-${randomNum}`;
}

const bookingSchema = new Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true,
        default: generateBookingId,
        index: true
    },
    // Canonical Model References (MongoDB Role Architecture)
    travelerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    propertyId: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
        index: true
    },
    hostId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    // Synonymous References (Preserving template & legacy compatibility)
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        index: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    guestDetails: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true }
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    nights: {
        type: Number,
        default: 1
    },
    guests: {
        adults: { type: Number, default: 1 },
        children: { type: Number, default: 0 },
        infants: { type: Number, default: 0 },
        total: { type: Number, default: 1 }
    },
    addOns: [
        {
            name: String,
            price: Number
        }
    ],
    price: {
        type: Number,
        default: 0
    },
    taxes: {
        type: Number,
        default: 0
    },
    serviceFee: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    pricing: {
        baseRate: { type: Number, default: 0 },
        baseTotal: { type: Number, default: 0 },
        addOnsTotal: { type: Number, default: 0 },
        serviceFee: { type: Number, default: 0 },
        taxes: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 }
    },
    paymentMethod: {
        type: String,
        default: "Demo UPI"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "paid"
    },
    bookingStatus: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "confirmed"
    },
    payment: {
        method: { type: String, default: "Demo UPI" },
        status: { type: String, default: "PAID • DEMO" },
        transactionId: { type: String, default: () => `TXN-DEMO-${Date.now()}` },
        paidAt: { type: Date, default: Date.now }
    },
    status: {
        type: String,
        enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
        default: "CONFIRMED"
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for ultra-efficient user and property queries
bookingSchema.index({ travelerId: 1, createdAt: -1 });
bookingSchema.index({ propertyId: 1, hostId: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ listing: 1, owner: 1 });

// Automatically keep dual references and fields in sync
bookingSchema.pre("validate", function () {
    // Sync travelerId <-> user
    if (!this.travelerId && this.user) this.travelerId = this.user;
    if (!this.user && this.travelerId) this.user = this.travelerId;

    // Sync propertyId <-> listing
    if (!this.propertyId && this.listing) this.propertyId = this.listing;
    if (!this.listing && this.propertyId) this.listing = this.propertyId;

    // Sync hostId <-> owner
    if (!this.hostId && this.owner) this.hostId = this.owner;
    if (!this.owner && this.hostId) this.owner = this.hostId;

    // Sync amounts
    if (this.pricing && this.pricing.totalAmount) {
        if (!this.totalAmount) this.totalAmount = this.pricing.totalAmount;
        if (!this.price && this.pricing.baseTotal) this.price = this.pricing.baseTotal;
        if (!this.taxes && this.pricing.taxes) this.taxes = this.pricing.taxes;
        if (!this.serviceFee && this.pricing.serviceFee) this.serviceFee = this.pricing.serviceFee;
    } else if (this.totalAmount) {
        if (!this.pricing) this.pricing = {};
        if (!this.pricing.totalAmount) this.pricing.totalAmount = this.totalAmount;
        if (!this.pricing.baseTotal && this.price) this.pricing.baseTotal = this.price;
        if (!this.pricing.taxes && this.taxes) this.pricing.taxes = this.taxes;
    }

    // Sync statuses
    if (this.bookingStatus) {
        this.status = this.bookingStatus.toUpperCase();
    } else if (this.status) {
        this.bookingStatus = this.status.toLowerCase();
    }

    // Sync payment
    if (this.paymentMethod && !this.payment?.method) {
        if (!this.payment) this.payment = {};
        this.payment.method = this.paymentMethod;
    }
});

// Virtuals for id string access
bookingSchema.virtual("ownerId").get(function () {
    const o = this.hostId || this.owner;
    if (!o) return null;
    return o._id ? o._id.toString() : o.toString();
});

bookingSchema.virtual("listingId").get(function () {
    const l = this.propertyId || this.listing;
    if (!l) return null;
    return l._id ? l._id.toString() : l.toString();
});

bookingSchema.virtual("userId").get(function () {
    const u = this.travelerId || this.user;
    if (!u) return null;
    return u._id ? u._id.toString() : u.toString();
});

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

module.exports = Booking;
module.exports.generateBookingId = generateBookingId;

