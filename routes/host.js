const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isHost, isListingOwner } = require("../middlewares");
const hostController = require("../controllers/host");

// Protect all host routes with login and host role check
router.use(isLoggedIn, isHost);

// Host Dashboard Overview
router.get("/dashboard", wrapAsync(hostController.dashboard));

// Host Properties List
router.get("/properties", wrapAsync(hostController.myProperties));

// Property-Specific Booking Tracker (enforces property ownership check)
router.get("/properties/:id/bookings", isListingOwner, wrapAsync(hostController.propertyBookings));

// Host updates booking status (Confirm / Cancel / Complete)
router.post("/bookings/:id/status", wrapAsync(hostController.updateBookingStatus));
router.patch("/bookings/:id/status", wrapAsync(hostController.updateBookingStatus));

// Host gets detailed booking view
router.get("/bookings/:id/details", wrapAsync(hostController.getBookingDetails));

module.exports = router;
