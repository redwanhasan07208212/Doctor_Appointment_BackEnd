import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDatabase from "./Config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoutes.js";
// app config
const app = express();
const port = process.env.port || 8000;
connectDatabase();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());

//api endpoint
app.get("/", (req, res) => {
  res.send("API is Working");
});

app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);

app.listen(port, () => {
  console.log("Server is Working Properly at port ", port);
});
