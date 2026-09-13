const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});

    // Top showcase stays for Bento Showcase (Spotlight + Stacked Pair)
    const topShowcaseTitles = [
        "Wayanad Forest Hideaway",
        "Kasol Riverside Cabin",
        "Kumarakom Lakefront Villa"
    ];

    const prioritized = [];
    for (const title of topShowcaseTitles) {
        const found = allListings.find(l => l.title && l.title.trim().toLowerCase() === title.toLowerCase());
        if (found) {
            prioritized.push(found);
        }
    }

    const remaining = allListings.filter(l => !prioritized.some(p => p._id.toString() === l._id.toString()));
    const orderedListings = [...prioritized, ...remaining];

    res.render("listings/index.ejs", { allListings: orderedListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Defensive fallback: guarantee listing.owner is attached to Admin if missing
    if (!listing.owner) {
        try {
            const User = require("../models/users");
            const adminUser = await User.findOne({ role: "admin" }) || await User.findOne({ username: "admin" });
            if (adminUser) {
                listing.owner = adminUser;
                await Listing.updateOne({ _id: listing._id }, { $set: { owner: adminUser._id } });
            }
        } catch (err) {
            console.error("Error setting Admin as fallback owner:", err);
        }
    }

    const hostStats = { totalBookings: 0, upcomingBookings: 0 };
    try {
        const Booking = require("../models/booking");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeBookings = await Booking.find({ listing: listing._id, status: { $ne: "CANCELLED" } });
        hostStats.totalBookings = activeBookings.length;
        hostStats.upcomingBookings = activeBookings.filter(b => b.checkOut && new Date(b.checkOut) >= today).length;
    } catch (e) {
        console.error("Error computing host stats:", e);
    }

    res.render("listings/show.ejs", { listing, hostStats });
};

module.exports.createListing = async (req, res) => {
    const newListing = new Listing({
        ...req.body.listing,
        image: {
            filename: req.file.filename,
            url: req.file.path,
        },
        owner: req.user._id,
    });

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let rawUrl = listing.imageUrl || (listing.image && listing.image.url) || "";
    let originalImageUrl = rawUrl && rawUrl.includes("/upload") 
        ? rawUrl.replace("/upload", "/upload/h_30,w_25") 
        : (rawUrl || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing || !listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("error", "You do not have permission to edit this listing!");
        return res.redirect(`/listings/${id}`);
    }

    await Listing.findByIdAndUpdate(id, {
        ...req.body.listing,
        image: { url: req.body.listing.image },
    });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
