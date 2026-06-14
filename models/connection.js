const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

const mongoOptions = {
  maxPoolSize: 5,
  minPoolSize: 1,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 5000,
  // connectTimeoutMS: 10000
};

mongoose
  .connect(MONGODB_URI, mongoOptions)
  .then(() => console.log("Database connected"))
  .catch((error) => console.error(error));
