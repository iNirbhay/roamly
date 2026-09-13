const User = require("../models/users");
const Listing = require("../models/listing");
const Booking = require("../models/booking");

/**
 * Ensures a single, legitimate Admin user exists as the owner of all properties.
 * Removes any artificial demonstration accounts or mock bookings.
 */
async function adminSetup() {
    try {
        console.log("--> Setting up Admin user and verifying listing ownership...");

        // 1. Find all Admin user accounts (case-insensitive search for 'admin' or role 'admin')
        let adminUsers = await User.find({
            $or: [
                { username: { $regex: /^admin$/i } },
                { role: "admin" }
            ]
        });

        let primaryAdmin = null;

        if (adminUsers.length > 0) {
            for (const u of adminUsers) {
                let changed = false;
                if (u.role !== "admin") {
                    u.role = "admin";
                    changed = true;
                }
                if (!u.name || u.name !== "Admin") {
                    u.name = "Admin";
                    changed = true;
                }
                if (!u.displayName || u.displayName !== "Admin") {
                    u.displayName = "Admin";
                    changed = true;
                }
                if (changed) {
                    await u.save();
                    console.log(`[AdminSetup] Promoted user '${u.username}' (${u._id}) to role: admin.`);
                }
            }
            // If the user signed in with 'Admin', use that as primaryAdmin
            primaryAdmin = adminUsers.find(u => u.username === "Admin") || adminUsers[0];
        } else {
            const newAdmin = new User({
                username: "Admin",
                email: "admin@roamly.travel",
                name: "Admin",
                displayName: "Admin",
                role: "admin"
            });
            primaryAdmin = await User.register(newAdmin, "admin123");
            console.log(`[AdminSetup] Created primary Admin user: ${primaryAdmin.username} (${primaryAdmin._id})`);
        }

        const adminUser = primaryAdmin;

        // 2. Check if database is empty and auto-seed if needed
        const listingCount = await Listing.countDocuments({});
        if (listingCount === 0) {
            console.log("[AdminSetup] Database is empty. Seeding 58 curated Indian listings...");
            const indianListings = require("./indian_listings.json");
            const docs = indianListings.map(item => ({
                ...item,
                owner: adminUser._id
            }));
            await Listing.insertMany(docs);
            console.log("[AdminSetup] Successfully seeded 58 listings into database!");
        } else {
            // Guarantee all existing properties belong to Admin's actual _id
            const updateResult = await Listing.updateMany(
                {},
                { $set: { owner: adminUser._id } }
            );
            console.log(`[AdminSetup] Ensured all properties belong to Admin (${adminUser._id}). Modified: ${updateResult.modifiedCount}`);
        }

        // Guarantee all existing bookings have hostId set to Admin as well
        await Booking.updateMany(
            {},
            { $set: { hostId: adminUser._id, owner: adminUser._id } }
        );

        // 3. Remove previously introduced fake demo users (Host Rahul, Host Priya, Traveler Aarav, etc.)
        const fakeUsernames = ["host_rahul", "host_priya", "traveler_demo", "admin_roamly"];
        const fakeUsers = await User.find({ username: { $in: fakeUsernames } });
        const fakeUserIds = fakeUsers.map(u => u._id);

        if (fakeUserIds.length > 0) {
            // Remove mock bookings belonging to fake users or seeded mock bookings
            await Booking.deleteMany({
                $or: [
                    { travelerId: { $in: fakeUserIds } },
                    { user: { $in: fakeUserIds } },
                    { hostId: { $in: fakeUserIds } },
                    { owner: { $in: fakeUserIds } }
                ]
            });
            // Remove fake users
            await User.deleteMany({ _id: { $in: fakeUserIds } });
            console.log(`[AdminSetup] Cleaned up ${fakeUserIds.length} mock demo users and their mock bookings.`);
        }

        console.log("--> Admin setup and listing ownership verification completed.");
        return adminUser;
    } catch (err) {
        console.error("Error in adminSetup:", err);
    }
}

module.exports = adminSetup;
