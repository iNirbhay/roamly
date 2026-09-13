const express = require("express");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware");
const reviews = require("../controllers/reviews");

const router = express.Router({ mergeParams: true });

router.post("/", isLoggedIn, validateReview, wrapAsync(reviews.createReview));
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviews.destroyReview));

module.exports = router;
