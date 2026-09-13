const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { generateBookingId } = require("../models/booking");

module.exports.renderCheckout = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("owner");

    if (!listing) {
        req.flash("error", "The requested sanctuary could not be found.");
        return res.redirect("/listings");
    }

    // Default dates: tomorrow to +3 nights
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter3 = new Date(tomorrow);
    dayAfter3.setDate(dayAfter3.getDate() + 3);

    const adults = parseInt(req.query.adults, 10) || 2;
    const children = parseInt(req.query.children, 10) || 0;
    const infants = parseInt(req.query.infants, 10) || 0;
    const roomsByAdults = Math.ceil(adults / 2);
    const roomsByInfants = Math.ceil(infants / 2);
    const roomsByTotal = Math.ceil((adults + children) / 3);
    const calculatedRooms = Math.max(1, roomsByAdults, roomsByInfants, roomsByTotal);
    const rooms = parseInt(req.query.rooms, 10) || calculatedRooms;

    const queryData = {
        checkIn: req.query.checkIn || tomorrow.toISOString().split("T")[0],
        checkOut: req.query.checkOut || dayAfter3.toISOString().split("T")[0],
        nights: parseInt(req.query.nights, 10) || 3,
        guests: parseInt(req.query.guests, 10) || (adults + children + infants),
        adults,
        children,
        infants,
        rooms
    };

    res.render("bookings/checkout.ejs", {
        listing,
        queryData
    });
};

module.exports.createBookingApi = async (req, res) => {
    try {
        const {
            listingId,
            guestDetails,
            checkIn,
            checkOut,
            nights,
            guests,
            rooms: reqRooms,
            addOns,
            pricing,
            payment
        } = req.body;

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required to book a sanctuary. Please sign in."
            });
        }

        if (!listingId || !guestDetails || !checkIn || !checkOut || !pricing) {
            return res.status(400).json({
                success: false,
                message: "Missing required booking information."
            });
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Sanctuary not found."
            });
        }

        const bookingId = generateBookingId();
        const adultsCount = Number(guests?.adults) || 1;
        const childrenCount = Number(guests?.children) || 0;
        const infantsCount = Number(guests?.infants) || 0;
        const allocatedRooms = Number(reqRooms) || Number(pricing?.rooms) || Math.max(1, Math.ceil(adultsCount / 2), Math.ceil(infantsCount / 2), Math.ceil((adultsCount + childrenCount) / 3));

        const newBooking = new Booking({
            bookingId,
            travelerId: req.user._id,
            propertyId: listing._id,
            hostId: listing.owner,
            user: req.user._id,
            listing: listing._id,
            owner: listing.owner,
            guestDetails: {
                fullName: guestDetails.fullName || req.user.name || req.user.username || "Roamly Guest",
                email: guestDetails.email || req.user.email || "guest@roamly.travel",
                phone: guestDetails.phone || "9876543210"
            },
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            nights: Number(nights) || 1,
            guests: {
                adults: adultsCount,
                children: childrenCount,
                infants: infantsCount,
                total: Number(guests?.total) || (adultsCount + childrenCount + infantsCount)
            },
            rooms: allocatedRooms,
            addOns: Array.isArray(addOns) ? addOns : [],
            price: Number(pricing.baseTotal) || 0,
            taxes: Number(pricing.taxes) || 0,
            serviceFee: Number(pricing.serviceFee) || 0,
            totalAmount: Number(pricing.totalAmount) || 0,
            pricing: {
                baseRate: Number(pricing.baseRate) || listing.price || 0,
                rooms: allocatedRooms,
                baseTotal: Number(pricing.baseTotal) || 0,
                addOnsTotal: Number(pricing.addOnsTotal) || 0,
                serviceFee: Number(pricing.serviceFee) || 0,
                taxes: Number(pricing.taxes) || 0,
                totalAmount: Number(pricing.totalAmount) || 0
            },
            paymentMethod: payment?.method || "Demo UPI",
            paymentStatus: "paid",
            bookingStatus: "confirmed",
            payment: {
                method: payment?.method || "Demo UPI",
                status: "PAID • DEMO",
                transactionId: `TXN-DEMO-${Date.now()}`,
                paidAt: new Date()
            },
            status: "CONFIRMED"
        });

        await newBooking.save();

        // Populate listing info for client response
        await newBooking.populate("listing");
        await newBooking.populate("propertyId");

        return res.status(201).json({
            success: true,
            bookingId: newBooking.bookingId,
            booking: newBooking
        });
    } catch (err) {
        console.error("Error creating booking in API:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to persist booking on server: " + err.message
        });
    }
};

module.exports.myBookings = async (req, res) => {
    let dbBookings = [];
    try {
        if (req.user) {
            // Strictly query by the currently authenticated user's ID
            dbBookings = await Booking.find({
                $or: [{ travelerId: req.user._id }, { user: req.user._id }]
            })
                .populate("listing")
                .populate("propertyId")
                .sort({ checkIn: -1 });
        }
    } catch (err) {
        console.error("Error fetching bookings from DB:", err);
    }

    res.render("bookings/index.ejs", {
        dbBookings
    });
};

module.exports.getMyBookingsApi = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }
    try {
        const bookings = await Booking.find({
            $or: [{ travelerId: req.user._id }, { user: req.user._id }]
        })
            .populate("propertyId")
            .populate("listing")
            .populate("hostId", "name username email")
            .populate("owner", "name username email")
            .sort({ checkIn: -1 });

        return res.json({ success: true, count: bookings.length, bookings });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports.getPropertyBookingsApi = async (req, res) => {
    const { propertyId } = req.params;
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }
    try {
        const listing = await Listing.findById(propertyId);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Property not found" });
        }

        const isOwner = listing.owner && (listing.owner.equals ? listing.owner.equals(req.user._id) : String(listing.owner) === String(req.user._id));
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Access denied. You do not manage this property." });
        }

        const bookings = await Booking.find({
            $or: [{ propertyId: listing._id }, { listing: listing._id }]
        })
            .populate("travelerId", "name username email phone")
            .populate("user", "name username email phone")
            .sort({ checkIn: -1 });

        return res.json({ success: true, count: bookings.length, bookings, property: listing });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports.updateBookingStatusApi = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }

    try {
        const booking = await Booking.findOne({
            $or: [{ _id: id }, { bookingId: id }]
        }).populate("listing");

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const hostRef = booking.hostId || booking.owner || (booking.listing && booking.listing.owner);
        const isOwner = hostRef && (hostRef.equals ? hostRef.equals(req.user._id) : String(hostRef) === String(req.user._id));
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden: You are not authorized to update this booking." });
        }

        const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
        const targetStatus = (status || "").toLowerCase();
        if (!validStatuses.includes(targetStatus)) {
            return res.status(400).json({ success: false, message: "Invalid status value. Must be pending, confirmed, cancelled, or completed." });
        }

        booking.bookingStatus = targetStatus;
        booking.status = targetStatus.toUpperCase();
        await booking.save();

        return res.json({ success: true, message: `Status updated to ${booking.status}`, booking });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports.getBookingDetails = async (req, res) => {
    const { bookingId } = req.params;
    let booking = await Booking.findOne({ bookingId }).populate("listing").populate("propertyId");
    if (!booking) {
        booking = await Booking.findById(bookingId).populate("listing").populate("propertyId").catch(() => null);
    }

    if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // Verify requesting user is either the traveler or host/admin
    const isTraveler = req.user && ((booking.travelerId && booking.travelerId.equals(req.user._id)) || (booking.user && booking.user.equals(req.user._id)));
    const hostRef = booking.hostId || booking.owner;
    const isHost = req.user && hostRef && (hostRef.equals ? hostRef.equals(req.user._id) : String(hostRef) === String(req.user._id));
    const isAdmin = req.user && req.user.role === "admin";

    if (!isTraveler && !isHost && !isAdmin) {
        return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, booking });
};

module.exports.downloadVoucher = async (req, res) => {
    const { bookingId } = req.params;
    let booking = await Booking.findOne({ bookingId }).populate("listing");

    if (!booking) {
        booking = await Booking.findById(bookingId).populate("listing").catch(() => null);
    }

    // Fallback if client has booking in localStorage
    if (!booking) {
        const fallback = {
            bookingId,
            guestDetails: {
                fullName: req.query.name || "Roamly Explorer",
                email: req.query.email || "explorer@roamly.travel",
                phone: req.query.phone || "+91 98765 43210"
            },
            checkIn: req.query.checkIn ? new Date(req.query.checkIn) : new Date(),
            checkOut: req.query.checkOut ? new Date(req.query.checkOut) : new Date(),
            nights: parseInt(req.query.nights, 10) || 3,
            guests: { total: parseInt(req.query.guests, 10) || 2 },
            pricing: {
                totalAmount: parseInt(req.query.total, 10) || 10000,
                baseTotal: parseInt(req.query.base, 10) || 9500,
                taxes: parseInt(req.query.taxes, 10) || 500
            },
            payment: {
                method: req.query.method || "Demo Card (4242)",
                status: "PAID • DEMO",
                transactionId: `TXN-DEMO-${Date.now()}`
            },
            status: "CONFIRMED",
            listing: {
                title: req.query.listingTitle || "Curated Roamly Sanctuary",
                location: req.query.location || "India",
                country: "India"
            }
        };
        return res.render("bookings/voucher.ejs", { booking: fallback });
    }

    res.render("bookings/voucher.ejs", { booking });
};
