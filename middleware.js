const Review = require("./models/review");
const { listingSchema, reviewSchema } = require("./schema");
const ExpressError = require("./utils/ExpressError");
const wrapAsync = require("./utils/wrapAsync");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        if (req.originalUrl && req.originalUrl.includes("checkout")) {
            req.flash("error", "Please sign in or create an account to book your sanctuary!");
        } else if (req.originalUrl && req.originalUrl.includes("bookings")) {
            req.flash("error", "Please sign in to view your bookings!");
        } else if (req.originalUrl && req.originalUrl.includes("new")) {
            req.flash("error", "You must be logged in to create a listing!");
        } else {
            req.flash("error", "You must be signed in to continue!");
        }
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isReviewAuthor = wrapAsync(async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review || !review.author || !review.author.equals(req.user._id)) {
        req.flash("error", "You do not have permission to delete this review!");
        return res.redirect(`/listings/${id}`);
    }

    next();
});

module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const message = error.details.map((detail) => detail.message).join(",");
        throw new ExpressError(message, 400);
    }
    next();
};

module.exports.validateImageUpload = (req, res, next) => {
    if (!req.file) {
        throw new ExpressError("A listing image is required", 400);
    }
    next();
};

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const message = error.details.map((detail) => detail.message).join(",");
        throw new ExpressError(message, 400);
    }
    next();
};

module.exports.isHost = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "Please sign in to access the Host Dashboard.");
        return res.redirect("/login");
    }
    const isAdmin = req.user.role === "admin" || (req.user.username && req.user.username.toLowerCase() === "admin");
    if (req.user.role !== "host" && !isAdmin) {
        req.flash("error", "Access restricted: Host or Admin privileges required.");
        return res.redirect("/listings");
    }
    next();
};

module.exports.isListingOwner = wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const Listing = require("./models/listing");
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Sanctuary not found.");
        return res.redirect("/host/dashboard");
    }

    const isAdmin = req.user.role === "admin" || (req.user.username && req.user.username.toLowerCase() === "admin");
    if (!isAdmin && (!listing.owner || !listing.owner.equals(req.user._id))) {
        req.flash("error", "Access denied: You do not own or manage this property.");
        return res.redirect("/host/dashboard");
    }

    req.listing = listing;
    next();
});
