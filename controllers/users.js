const User = require("../models/users");

module.exports.renderSignupForm = (req, res) => {
    if (req.isAuthenticated()) {
        const target = (req.user && (req.user.role === "host" || req.user.role === "admin")) ? "/host/dashboard" : "/listings";
        return res.redirect(target);
    }
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password, role, name, phone } = req.body;
        const cleanUsername = username ? username.trim() : "";
        const isAdmin = cleanUsername.toLowerCase() === "admin" || (email && email.toLowerCase().includes("admin@roamly.travel"));
        const validRole = isAdmin ? "admin" : (role === "host" ? "host" : "user");

        const user = new User({
            username: cleanUsername,
            email: email ? email.trim().toLowerCase() : "",
            name: name ? name.trim() : (cleanUsername || "Traveler"),
            displayName: name ? name.trim() : (cleanUsername || "Traveler"),
            phone: phone ? phone.trim() : "",
            role: validRole
        });
        const registeredUser = await User.register(user, password);

        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", `Welcome to Roamly, ${registeredUser.name || registeredUser.username}!`);
            const defaultTarget = (registeredUser.role === "host" || registeredUser.role === "admin") ? "/host/dashboard" : "/listings";
            const redirectUrl = res.locals.redirectUrl || req.session.redirectUrl || defaultTarget;
            delete req.session.redirectUrl;
            res.redirect(redirectUrl);
        });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    if (req.isAuthenticated()) {
        const target = (req.user && (req.user.role === "host" || req.user.role === "admin")) ? "/host/dashboard" : "/listings";
        return res.redirect(target);
    }
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    if (req.user && req.user.username && req.user.username.toLowerCase() === "admin") {
        if (req.user.role !== "admin") {
            req.user.role = "admin";
            try {
                await User.updateOne({ _id: req.user._id }, { $set: { role: "admin", name: req.user.name || "Admin", displayName: "Admin" } });
            } catch (err) {
                console.error("Error auto-promoting admin in login:", err);
            }
        }
    }
    req.flash("success", "Welcome Back!");
    const defaultTarget = (req.user && (req.user.role === "host" || req.user.role === "admin")) ? "/host/dashboard" : "/listings";
    let redirectUrl = res.locals.redirectUrl || req.session.redirectUrl || defaultTarget;
    if (!redirectUrl || redirectUrl === "/login" || redirectUrl === "/signup") {
        redirectUrl = defaultTarget;
    }
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Logged Out!");
        res.redirect("/listings");
    });
};

module.exports.googleCallback = (req, res) => {
    const name = req.user.displayName || req.user.username || "traveler";
    req.flash("success", `Welcome to Roamly, ${name}!`);
    const defaultTarget = (req.user && (req.user.role === "host" || req.user.role === "admin")) ? "/host/dashboard" : "/listings";
    const redirectUrl = req.session.redirectUrl || defaultTarget;
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
};

module.exports.auth0Callback = (req, res) => {
    const name = req.user.displayName || req.user.username || "traveler";
    req.flash("success", `Welcome to Roamly, ${name}!`);
    const defaultTarget = (req.user && (req.user.role === "host" || req.user.role === "admin")) ? "/host/dashboard" : "/listings";
    const redirectUrl = req.session.redirectUrl || defaultTarget;
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
};
