const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Auth0Strategy = require("passport-auth0");
const User = require("../models/users");

// Passport configuration with Google OAuth 2.0 & Auth0 strategies
async function generateUniqueUsername(base) {
    let clean = (base || "wanderer")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);

    if (!clean) clean = "traveler";

    let candidate = clean;
    let count = 1;

    while (await User.findOne({ username: candidate })) {
        candidate = `${clean}${Math.floor(100 + Math.random() * 900)}`;
        count++;
        if (count > 10) {
            candidate = `${clean}_${Date.now()}`;
            break;
        }
    }
    return candidate;
}

function configurePassport() {
    // 1. Local Strategy (existing username/password)
    passport.use(new LocalStrategy(User.authenticate()));

    // 2. Google OAuth 2.0 Strategy
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || "http://localhost:8080/auth/google/callback";

    if (googleClientId && googleClientSecret) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: googleClientId,
                    clientSecret: googleClientSecret,
                    callbackURL: googleCallbackUrl,
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        // 1. Try to find user by googleId
                        let user = await User.findOne({ googleId: profile.id });
                        if (user) {
                            return done(null, user);
                        }

                        // 2. Try to match by email if user previously registered locally
                        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                        if (email) {
                            user = await User.findOne({ email });
                            if (user) {
                                // Link Google ID & avatar to existing account
                                user.googleId = profile.id;
                                if (!user.avatar && profile.photos && profile.photos[0]) {
                                    user.avatar = profile.photos[0].value;
                                }
                                if (!user.displayName && profile.displayName) {
                                    user.displayName = profile.displayName;
                                }
                                await user.save();
                                return done(null, user);
                            }
                        }

                        // 3. Create a new user for Google Sign-In
                        const baseName = (email ? email.split("@")[0] : profile.displayName) || "traveler";
                        const username = await generateUniqueUsername(baseName);

                        const newUser = new User({
                            username,
                            email: email || `${username}@roamly.travel`,
                            googleId: profile.id,
                            displayName: profile.displayName || username,
                            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
                            authProvider: "google",
                        });

                        await newUser.save();
                        return done(null, newUser);
                    } catch (err) {
                        return done(err, null);
                    }
                }
            )
        );
        console.log("✅ Google OAuth 2.0 initialized successfully.");
    } else {
        console.log("ℹ️  Google OAuth credentials not detected in .env (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
    }

    // 3. Auth0 Strategy (as requested via passport-auth0)
    const auth0Domain = process.env.AUTH0_DOMAIN;
    const auth0ClientId = process.env.AUTH0_CLIENT_ID;
    const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET;
    const auth0CallbackUrl = process.env.AUTH0_CALLBACK_URL || "http://localhost:8080/auth/auth0/callback";

    if (auth0Domain && auth0ClientId && auth0ClientSecret) {
        passport.use(
            new Auth0Strategy(
                {
                    domain: auth0Domain,
                    clientID: auth0ClientId,
                    clientSecret: auth0ClientSecret,
                    callbackURL: auth0CallbackUrl,
                },
                async (accessToken, refreshToken, extraParams, profile, done) => {
                    try {
                        let user = await User.findOne({ auth0Id: profile.id });
                        if (user) {
                            return done(null, user);
                        }

                        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                        if (email) {
                            user = await User.findOne({ email });
                            if (user) {
                                user.auth0Id = profile.id;
                                if (!user.avatar && profile.picture) {
                                    user.avatar = profile.picture;
                                }
                                await user.save();
                                return done(null, user);
                            }
                        }

                        const baseName = (email ? email.split("@")[0] : profile.displayName) || "traveler";
                        const username = await generateUniqueUsername(baseName);

                        const newUser = new User({
                            username,
                            email: email || `${username}@roamly.travel`,
                            auth0Id: profile.id,
                            displayName: profile.displayName || username,
                            avatar: profile.picture || "",
                            authProvider: "auth0",
                        });

                        await newUser.save();
                        return done(null, newUser);
                    } catch (err) {
                        return done(err, null);
                    }
                }
            )
        );
        console.log("✅ Auth0 OAuth initialized successfully.");
    }

    // 4. Unified Passport Serialization / Deserialization
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            if (user && user.username && user.username.toLowerCase() === "admin" && user.role !== "admin") {
                user.role = "admin";
                await User.updateOne({ _id: user._id }, { $set: { role: "admin", name: user.name || "Admin", displayName: "Admin" } });
            }
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
}

function isGoogleConfigured() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function isAuth0Configured() {
    return Boolean(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET);
}

module.exports = {
    configurePassport,
    isGoogleConfigured,
    isAuth0Configured,
};
