import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected ✅: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed ❌");
    console.error(`Root Error: ${error.message}`);

    if (error.message.includes('ECONNREFUSED')) {
      console.log("Tip: Check if your IP is whitelisted in MongoDB Atlas or if you're behind a strict firewall.");
    }

    process.exit(1);
  }
};

export default connectDB;
