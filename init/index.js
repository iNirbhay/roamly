const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const { init } = require("../models/review.js");

const User = require("../models/users.js");
const adminSetup = require("./adminSetup.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  const admin = await adminSetup();
  initData.data = initData.data.map((obj) => ({ ...obj, owner: admin._id }));
  await Listing.insertMany(initData.data);
  console.log(`data was initialized with Admin (${admin.username}) as host for all listings`);
};

initDB();