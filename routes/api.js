const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/users");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const bookingsController = require("../controllers/bookings");
const { isLoggedIn, isHost } = require("../middlewares");

// ==========================================
// 1. AUTHENTICATION REST API
// ==========================================

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
    try {
        const { username, email, password, role, name, phone } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "Username, email, and password are required." });
        }

        const validRole = role === "host" ? "host" : "user";
        const newUser = new User({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            name: name ? name.trim() : username.trim(),
            displayName: name ? name.trim() : username.trim(),
            phone: phone ? phone.trim() : "",
            role: validRole
        });

        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            return res.status(201).json({
                success: true,
                message: "Registration successful",
                user: {
                    _id: registeredUser._id,
                    username: registeredUser.username,
                    name: registeredUser.name,
                    email: registeredUser.email,
                    role: registeredUser.role
                }
            });
        });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// POST /api/auth/login
router.post("/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ success: false, message: info?.message || "Invalid credentials" });

        req.login(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            return res.json({
                success: true,
                message: "Logged in successfully",
                user: {
                    _id: user._id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });
    })(req, res, next);
});

// GET /api/auth/me
router.get("/auth/me", (req, res) => {
    if (!req.user) {
        return res.json({ success: false, authenticated: false, user: null });
    }
    return res.json({
        success: true,
        authenticated: true,
        user: {
            _id: req.user._id,
            username: req.user.username,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// ==========================================
// 2. PROPERTIES REST API
// ==========================================

// GET /api/properties
router.get("/properties", async (req, res) => {
    try {
        const properties = await Listing.find({}).populate("owner", "name username email role");
        return res.json({ success: true, count: properties.length, properties });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/properties/:id
router.get("/properties/:id", async (req, res) => {
    try {
        const property = await Listing.findById(req.params.id)
            .populate("owner", "name username email role")
            .populate("reviews");
        if (!property) return res.status(404).json({ success: false, message: "Property not found" });
        return res.json({ success: true, property });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/properties
router.post("/properties", isLoggedIn, isHost, async (req, res) => {
    try {
        const newProperty = new Listing({
            ...req.body,
            owner: req.user._id
        });
        await newProperty.save();
        return res.status(201).json({ success: true, property: newProperty });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// PUT /api/properties/:id
router.put("/properties/:id", isLoggedIn, async (req, res) => {
    try {
        const property = await Listing.findById(req.params.id);
        if (!property) return res.status(404).json({ success: false, message: "Property not found" });

        const isOwner = property.owner && (property.owner.equals ? property.owner.equals(req.user._id) : String(property.owner) === String(req.user._id));
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden: You do not own this property" });
        }

        Object.assign(property, req.body);
        await property.save();
        return res.json({ success: true, property });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// DELETE /api/properties/:id
router.delete("/properties/:id", isLoggedIn, async (req, res) => {
    try {
        const property = await Listing.findById(req.params.id);
        if (!property) return res.status(404).json({ success: false, message: "Property not found" });

        const isOwner = property.owner && (property.owner.equals ? property.owner.equals(req.user._id) : String(property.owner) === String(req.user._id));
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden: You do not own this property" });
        }

        await Listing.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: "Property deleted successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 3. BOOKINGS REST API
// ==========================================

// POST /api/bookings
router.post("/bookings", isLoggedIn, bookingsController.createBookingApi);

// GET /api/bookings/my
router.get("/bookings/my", isLoggedIn, bookingsController.getMyBookingsApi);

// GET /api/bookings/:bookingId
router.get("/bookings/:bookingId", isLoggedIn, bookingsController.getBookingDetails);

// GET /api/properties/:propertyId/bookings
router.get("/properties/:propertyId/bookings", isLoggedIn, bookingsController.getPropertyBookingsApi);

// PATCH /api/bookings/:id/status
router.patch("/bookings/:id/status", isLoggedIn, bookingsController.updateBookingStatusApi);

module.exports = router;
