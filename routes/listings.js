const express = require("express");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, validateListing, validateImageUpload } = require("../middlewares");
const listings = require("../controllers/listings");
const router = express.Router();
const multer  = require('multer')
const {storage} = require("../cloudConfig.js")
const upload = multer({ storage });

router.route("/")
    .get(wrapAsync(listings.index))
    .post(isLoggedIn, upload.single('listing[image]'), validateImageUpload, validateListing, wrapAsync(listings.createListing));

router.get("/new", isLoggedIn, listings.renderNewForm);

router.route("/:id")
    .get(wrapAsync(listings.showListing))
    .put(isLoggedIn, upload.single('listing[image]'), validateListing, wrapAsync(listings.updateListing))
    .delete(isLoggedIn, wrapAsync(listings.destroyListing));

router.get("/:id/edit", isLoggedIn, wrapAsync(listings.renderEditForm));

module.exports = router;
