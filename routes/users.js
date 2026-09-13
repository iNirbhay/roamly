const express = require("express");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync");
const { saveRedirectUrl } = require("../middlewares");
const users = require("../controllers/users");
const { isGoogleConfigured, isAuth0Configured } = require("../config/passport");

const router = express.Router();

router.route("/signup")
    .get(users.renderSignupForm)
    .post(saveRedirectUrl, wrapAsync(users.signup));

router.route("/login")
    .get(users.renderLoginForm)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", { failureFlash: true, failureRedirect: "/login" }),
        users.login
    );

router.get("/logout", users.logout);

// Google OAuth Routes
router.get("/auth/google", (req, res, next) => {
    if (!isGoogleConfigured()) {
        const hint = (process.env.VERCEL || process.env.NODE_ENV === "production")
            ? "Google Sign-In requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel Project Settings > Environment Variables."
            : "Google Sign-In is not configured yet. Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.";
        req.flash("error", hint);
        return res.redirect("/login");
    }
    passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })(req, res, next);
});

router.get(
    "/auth/google/callback",
    (req, res, next) => {
        if (req.query.error) {
            req.flash("error", "Google Sign-In was cancelled or denied.");
            return res.redirect("/login");
        }
        if (!isGoogleConfigured()) {
            req.flash("error", "Google Sign-In configuration missing.");
            return res.redirect("/login");
        }
        passport.authenticate("google", {
            failureFlash: true,
            failureRedirect: "/login",
        })(req, res, next);
    },
    users.googleCallback
);

// Auth0 OAuth Routes
router.get("/auth/auth0", (req, res, next) => {
    if (!isAuth0Configured()) {
        req.flash(
            "error",
            "Auth0 is not configured yet. Please provide AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET in your .env file."
        );
        return res.redirect("/login");
    }
    passport.authenticate("auth0", { scope: "openid email profile" })(req, res, next);
});

router.get(
    "/auth/auth0/callback",
    (req, res, next) => {
        if (!isAuth0Configured()) {
            req.flash("error", "Auth0 configuration missing.");
            return res.redirect("/login");
        }
        passport.authenticate("auth0", {
            failureFlash: true,
            failureRedirect: "/login",
        })(req, res, next);
    },
    users.auth0Callback
);

module.exports = router;
