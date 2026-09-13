if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}


const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ExpressError = require("./utils/ExpressError");
const wrapAsync = require("./utils/wrapAsync");
const User = require("./models/users");
const Listing = require("./models/listing");

const listingRoutes = require("./routes/listings");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");
const bookingRoutes = require("./routes/bookings");
const hostRoutes = require("./routes/host");
const apiRoutes = require("./routes/api");
const adminSetup = require("./init/adminSetup");

const { configurePassport, isGoogleConfigured, isAuth0Configured } = require("./config/passport");

const app = express();

main()
    .then(async () => {
        console.log("Connected to MongoDB");
        await adminSetup();
    })
    .catch((err) => console.error("Error connecting to MongoDB", err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const sessionOptions = {
    secret: "Seltos@1691",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
configurePassport();

function resolveListingImage(listing) {
    if (!listing) return "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80";
    if (listing.imageUrl) return listing.imageUrl;
    if (listing.image && typeof listing.image.url === "string" && listing.image.url.trim() !== "") {
        return listing.image.url.trim();
    }
    if (typeof listing.image === "string" && listing.image.trim() !== "") {
        return listing.image.trim();
    }
    if (typeof listing.images === "string" && listing.images.trim() !== "") {
        return listing.images.trim();
    }
    if (Array.isArray(listing.images) && listing.images.length > 0) {
        const first = listing.images[0];
        if (typeof first === "string" && first.trim() !== "") return first.trim();
        if (first && typeof first.url === "string" && first.url.trim() !== "") return first.url.trim();
    }
    return "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80";
}

app.use(async (req, res, next) => {
    // Proactively promote any Admin / admin user session to role: 'admin'
    if (req.user && req.user.username && req.user.username.toLowerCase() === "admin") {
        if (req.user.role !== "admin") {
            req.user.role = "admin";
            try {
                await User.updateOne({ _id: req.user._id }, { $set: { role: "admin", name: req.user.name || "Admin", displayName: "Admin" } });
            } catch (e) {
                console.error("Error auto-promoting admin role:", e);
            }
        }
    }

    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.isGoogleConfigured = isGoogleConfigured();
    res.locals.isAuth0Configured = isAuth0Configured();
    res.locals.resolveListingImage = resolveListingImage;
    res.locals.currentPath = req.path;
    next();
});

app.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/home.ejs", { allListings });
}));

app.get("/explore-india", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({}).populate("reviews");
    res.render("listings/explore_india.ejs", { allListings });
}));

app.use("/api", apiRoutes);
app.use("/listings", listingRoutes);
app.use("/listings/:id/reviews", reviewRoutes);
app.use("/", userRoutes);
app.use("/", bookingRoutes);
app.use("/host", hostRoutes);

app.all("/{*splat}", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    res.status(statusCode).render("error.ejs", { err });
});

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});
