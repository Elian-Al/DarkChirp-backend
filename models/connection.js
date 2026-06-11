const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, { connectTimeoutMS: 10000 })
  .then(() => console.log("Database connected"))
  .catch((error) => console.error(error));
