import express from "express";
import upload from "../middlewares/multer.js";
import {
  bookAppointment,
  getProfile,
  listAppointments,
  loginUser,
  registerUser,
  updateProfile,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";

const userRouter = express.Router();
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/getProfile", authUser, getProfile);
userRouter.post(
  "/updateProfile",
  upload.single("image"),
  authUser,
  updateProfile
);
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/list-appointment", authUser, listAppointments);

export default userRouter;
