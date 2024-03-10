import mongoose from "mongoose";

export const connect = async () => {
  await mongoose.connect("mongodb://localhost:27017/ChatterUp");
  console.log("DB is connected");
};
