const Listing = require("../models/listing");
const Booking = require("../models/booking");

module.exports.dashboard = async (req, res) => {
    try {
        const isUserAdmin = req.user.role === "admin" || (req.user.username && req.user.username.toLowerCase() === "admin");
        const propertyFilter = isUserAdmin ? {} : { owner: req.user._id };

        // 1. Fetch properties owned by this host
        const properties = await Listing.find(propertyFilter).lean();
        const propertyIds = properties.map(p => p._id);

        // 2. Fetch all bookings for these properties
        const allBookings = await Booking.find({
            $or: [{ listing: { $in: propertyIds } }, { propertyId: { $in: propertyIds } }]
        })
            .populate("listing")
            .populate("propertyId")
            .populate("travelerId", "name username email")
            .populate("user", "name username email")
            .sort({ createdAt: -1 })
            .lean();

        // 3. Compute dynamic metrics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalRevenue = 0;
        let upcomingCount = 0;
        let pendingCount = 0;
        let confirmedCount = 0;
        let completedCount = 0;
        let cancelledCount = 0;

        const propertyStatsMap = {};
        propertyIds.forEach(id => {
            propertyStatsMap[id.toString()] = { total: 0, upcoming: 0, revenue: 0 };
        });

        allBookings.forEach(b => {
            const listId = (b.listing && b.listing._id) ? b.listing._id.toString() : (b.listing ? b.listing.toString() : null);
            const checkOut = b.checkOut ? new Date(b.checkOut) : null;
            const isUpcoming = checkOut && checkOut >= today;

            if (listId && propertyStatsMap[listId]) {
                propertyStatsMap[listId].total++;
                if (b.status !== "CANCELLED") {
                    propertyStatsMap[listId].revenue += (b.pricing?.totalAmount || 0);
                    if (isUpcoming) {
                        propertyStatsMap[listId].upcoming++;
                    }
                }
            }

            if (b.status === "CANCELLED") {
                cancelledCount++;
            } else {
                totalRevenue += (b.pricing?.totalAmount || 0);
                if (b.status === "PENDING") {
                    pendingCount++;
                } else if (b.status === "CONFIRMED") {
                    confirmedCount++;
                } else if (b.status === "COMPLETED") {
                    completedCount++;
                }

                if (isUpcoming) {
                    upcomingCount++;
                }
            }
        });

        // Attach dynamic stats to each property
        const enrichedProperties = properties.map(p => {
            const stats = propertyStatsMap[p._id.toString()] || { total: 0, upcoming: 0, revenue: 0 };
            return {
                ...p,
                totalBookingsCount: stats.total,
                upcomingBookingsCount: stats.upcoming,
                revenueGenerated: stats.revenue
            };
        });

        // 4. Upcoming guests (active upcoming stays sorted soonest first)
        const upcomingGuests = allBookings
            .filter(b => b.status !== "CANCELLED" && b.checkOut && new Date(b.checkOut) >= today)
            .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
            .slice(0, 6);

        // 5. Recent Bookings
        const recentBookings = allBookings.slice(0, 8);

        const metrics = {
            totalProperties: properties.length,
            totalBookings: allBookings.length,
            upcomingStays: upcomingCount,
            pendingBookings: pendingCount,
            confirmedBookings: confirmedCount,
            completedBookings: completedCount,
            cancelledBookings: cancelledCount,
            revenue: totalRevenue
        };

        res.render("host/dashboard.ejs", {
            metrics,
            properties: enrichedProperties,
            recentBookings,
            upcomingGuests,
            isUserAdmin
        });
    } catch (err) {
        console.error("Error in host dashboard controller:", err);
        req.flash("error", "Failed to load host dashboard: " + err.message);
        res.redirect("/listings");
    }
};

module.exports.myProperties = async (req, res) => {
    try {
        const isUserAdmin = req.user.role === "admin" || (req.user.username && req.user.username.toLowerCase() === "admin");
        const propertyFilter = isUserAdmin ? {} : { owner: req.user._id };

        const properties = await Listing.find(propertyFilter).lean();
        const propertyIds = properties.map(p => p._id);

        const allBookings = await Booking.find({ listing: { $in: propertyIds } }).lean();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const propertyStatsMap = {};
        propertyIds.forEach(id => {
            propertyStatsMap[id.toString()] = { total: 0, upcoming: 0, revenue: 0 };
        });

        allBookings.forEach(b => {
            const listId = b.listing ? b.listing.toString() : null;
            const checkOut = b.checkOut ? new Date(b.checkOut) : null;
            if (listId && propertyStatsMap[listId]) {
                propertyStatsMap[listId].total++;
                if (b.status !== "CANCELLED") {
                    propertyStatsMap[listId].revenue += (b.pricing?.totalAmount || 0);
                    if (checkOut && checkOut >= today) {
                        propertyStatsMap[listId].upcoming++;
                    }
                }
            }
        });

        const enrichedProperties = properties.map(p => {
            const stats = propertyStatsMap[p._id.toString()] || { total: 0, upcoming: 0, revenue: 0 };
            return {
                ...p,
                totalBookingsCount: stats.total,
                upcomingBookingsCount: stats.upcoming,
                revenueGenerated: stats.revenue
            };
        });

        res.render("host/properties.ejs", {
            properties: enrichedProperties,
            isUserAdmin
        });
    } catch (err) {
        console.error("Error in host myProperties controller:", err);
        req.flash("error", "Failed to load properties: " + err.message);
        res.redirect("/host/dashboard");
    }
};

module.exports.propertyBookings = async (req, res) => {
    try {
        const listing = req.listing; // Provided by isListingOwner middleware
        const bookings = await Booking.find({
            $or: [{ listing: listing._id }, { propertyId: listing._id }]
        })
            .populate("travelerId", "name username email phone")
            .populate("user", "name username email phone")
            .sort({ checkIn: -1 })
            .lean();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalRevenue = 0;
        let upcomingCount = 0;
        let pendingCount = 0;
        let confirmedCount = 0;
        let completedCount = 0;
        let cancelledCount = 0;

        bookings.forEach(b => {
            const checkOut = b.checkOut ? new Date(b.checkOut) : null;
            if (b.status === "CANCELLED") {
                cancelledCount++;
            } else {
                totalRevenue += (b.pricing?.totalAmount || 0);
                if (b.status === "PENDING") pendingCount++;
                if (b.status === "CONFIRMED") confirmedCount++;
                if (b.status === "COMPLETED") completedCount++;
                if (checkOut && checkOut >= today) upcomingCount++;
            }
        });

        const stats = {
            totalBookings: bookings.length,
            upcomingCount,
            pendingCount,
            confirmedCount,
            completedCount,
            cancelledCount,
            totalRevenue
        };

        res.render("host/property_bookings.ejs", {
            listing,
            bookings,
            stats
        });
    } catch (err) {
        console.error("Error in propertyBookings controller:", err);
        req.flash("error", "Failed to load property bookings: " + err.message);
        res.redirect("/host/dashboard");
    }
};

module.exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
        if (!validStatuses.includes(status)) {
            if (req.xhr || req.headers.accept?.includes("json")) {
                return res.status(400).json({ success: false, message: "Invalid booking status." });
            }
            req.flash("error", "Invalid booking status.");
            return res.redirect("back");
        }

        const booking = await Booking.findById(id).populate("listing");
        if (!booking) {
            if (req.xhr || req.headers.accept?.includes("json")) {
                return res.status(404).json({ success: false, message: "Booking not found." });
            }
            req.flash("error", "Booking not found.");
            return res.redirect("back");
        }

        // Verify that the host owns this property (or is admin)
        const isUserAdmin = req.user.role === "admin" || (req.user.username && req.user.username.toLowerCase() === "admin");
        const isOwner = booking.listing && booking.listing.owner && booking.listing.owner.equals(req.user._id);

        if (!isUserAdmin && !isOwner) {
            if (req.xhr || req.headers.accept?.includes("json")) {
                return res.status(403).json({ success: false, message: "Access denied. You do not own this property." });
            }
            req.flash("error", "Access denied: You do not own this property.");
            return res.redirect("/host/dashboard");
        }

        // Validation against nonsensical state changes
        if (booking.status === "CANCELLED" && status === "CONFIRMED") {
            const msg = "Cannot confirm an already cancelled booking.";
            if (req.xhr || req.headers.accept?.includes("json")) {
                return res.status(400).json({ success: false, message: msg });
            }
            req.flash("error", msg);
            return res.redirect("back");
        }

        if (booking.status === "COMPLETED" && status === "PENDING") {
            const msg = "Cannot mark a completed stay as pending.";
            if (req.xhr || req.headers.accept?.includes("json")) {
                return res.status(400).json({ success: false, message: msg });
            }
            req.flash("error", msg);
            return res.redirect("back");
        }

        booking.status = status;
        booking.bookingStatus = status.toLowerCase();
        await booking.save();

        if (req.xhr || req.headers.accept?.includes("json")) {
            return res.json({
                success: true,
                message: `Booking ${booking.bookingId} marked as ${status}.`,
                status: booking.status,
                bookingStatus: booking.bookingStatus,
                booking
            });
        }

        req.flash("success", `Booking ${booking.bookingId} status updated to ${status}.`);
        res.redirect("back");
    } catch (err) {
        console.error("Error updating booking status:", err);
        if (req.xhr || req.headers.accept?.includes("json")) {
            return res.status(500).json({ success: false, message: err.message });
        }
        req.flash("error", "Failed to update booking status: " + err.message);
        res.redirect("back");
    }
};

module.exports.deleteBookingRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id).populate("listing");
        if (!booking) {
            if (req.xhr || req.headers.accept?.includes("json")) {
                return res.status(404).json({ success: false, message: "Booking not found." });
            }
            req.flash("error", "Booking not found.");
            return res.redirect("back");
        }

        const isUserAdmin = req.user.role === "admin" || (req.user.username && req.user.username.toLowerCase() === "admin");
        const isOwner = booking.listing && booking.listing.owner && booking.listing.owner.equals(req.user._id);

        if (!isUserAdmin && !isOwner) {
            if (req.xhr || req.headers.accept?.includes("json")) {
                return res.status(403).json({ success: false, message: "Access denied. You do not own this property." });
            }
            req.flash("error", "Access denied: You do not own this property.");
            return res.redirect("/host/dashboard");
        }

        // Host deleting/rejecting request sets it to CANCELLED so traveler sees it in My Bookings
        booking.status = "CANCELLED";
        booking.bookingStatus = "cancelled";
        await booking.save();

        if (req.xhr || req.headers.accept?.includes("json")) {
            return res.json({
                success: true,
                message: `Booking request ${booking.bookingId} cancelled by host.`,
                status: "CANCELLED",
                booking
            });
        }

        req.flash("success", `Booking request ${booking.bookingId} deleted / cancelled.`);
        res.redirect("back");
    } catch (err) {
        console.error("Error deleting booking request:", err);
        if (req.xhr || req.headers.accept?.includes("json")) {
            return res.status(500).json({ success: false, message: err.message });
        }
        req.flash("error", "Failed to delete booking request: " + err.message);
        res.redirect("back");
    }
};

module.exports.getBookingDetails = async (req, res) => {
    try {
        const { id } = req.params;
        let booking = await Booking.findOne({ bookingId: id }).populate("listing").populate("user", "username email");
        if (!booking) {
            booking = await Booking.findById(id).populate("listing").populate("user", "username email");
        }

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        const isUserAdmin = req.user.role === "admin" || (req.user.username && req.user.username.toLowerCase() === "admin");
        const isOwner = booking.listing && booking.listing.owner && booking.listing.owner.equals(req.user._id);

        if (!isUserAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        res.json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
