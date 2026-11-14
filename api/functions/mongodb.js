import mongoose from "mongoose";

const CONNECTION_URL = `mongodb://${process.env.MONGO_API_USER}:${process.env.MONGO_API_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`;

mongoose.connection.on("connected", () => console.log("MongoDB OK"));
mongoose.connection.on("disconnected", () =>
  console.log("MongoDB Disconnected"),
);
mongoose.connection.on("error", (err) =>
  console.log(`MongoDB error: ${err}`),
);
mongoose.connection.on("close", () => console.log("MongoDB close"));

const mongoClient = await mongoose.connect(CONNECTION_URL, {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000, //waiting time if the pool is fully used
});



export default mongoClient;

