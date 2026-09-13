const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const bookings = require("../controllers/bookings");

// Checkout page for a listing - requires authentication
router.get("/listings/:id/checkout", isLoggedIn, wrapAsync(bookings.renderCheckout));

// API endpoint to create/persist booking - requires authentication
router.post("/api/bookings", isLoggedIn, express.json(), wrapAsync(bookings.createBookingApi));

// My Bookings dashboard (HTML page) - requires authentication
router.get("/bookings", isLoggedIn, wrapAsync(bookings.myBookings));

// REST: Current user's bookings (JSON)
router.get("/api/bookings/my", isLoggedIn, wrapAsync(bookings.getMyBookingsApi));

// REST: Property's bookings for host/admin (JSON)
router.get("/api/properties/:propertyId/bookings", isLoggedIn, wrapAsync(bookings.getPropertyBookingsApi));

// Booking details (JSON) - requires authentication
router.get("/bookings/:bookingId/details", isLoggedIn, wrapAsync(bookings.getBookingDetails));
router.get("/api/bookings/:bookingId", isLoggedIn, wrapAsync(bookings.getBookingDetails));

// REST: Update booking status - requires authentication
router.patch("/api/bookings/:id/status", isLoggedIn, express.json(), wrapAsync(bookings.updateBookingStatusApi));

// Printable/downloadable travel voucher
router.get("/bookings/:bookingId/voucher", wrapAsync(bookings.downloadVoucher));

module.exports = router;
