import express from "express";
import upload from "../middlewares/multer.js";
import {
  bookAppointment,
  cancelAppointment,
  getProfile,
  initiateSSLCommerzPayment,
  listAppointments,
  loginUser,
  registerUser,
  updateProfile,
  verifyPayment,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";

const userRouter = express.Router();

// User Authentication Routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/getProfile", authUser, getProfile);
userRouter.post(
  "/updateProfile",
  upload.single("image"),
  authUser,
  updateProfile
);

// Appointment Routes
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/list-appointment", authUser, listAppointments);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);

// SSLCommerz Payment Routes
userRouter.post("/payment/initiate", authUser, initiateSSLCommerzPayment);
userRouter.post("/payment/verify", verifyPayment);

export default userRouter;
