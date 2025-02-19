import validator from "validator";
import bcrypt from "bcrypt";
import UserModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import DoctorModel from "../models/doctorModels.js";
import appointmentModel from "../models/appointmentModel.js";
const registerUser = async (req, res) => {
  try {
    // console.log(req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Enter a strong Password" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_SALT_ROUNDS)
    );

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new UserModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET);
    res.json({ success: true, token });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User dost not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid Credentials" });
    }
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await UserModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    // Parse request data
    let requestData;
    try {
      requestData = req.body.data ? JSON.parse(req.body.data) : req.body;
    } catch (error) {
      return res.json({ success: false, message: "Invalid data format" });
    }

    const { name, phone, address, dob, gender } = requestData;
    const userId = req.user.id; // Extract userId from auth middleware
    const imageFile = req.file;

    // Validate required fields
    if (!name || !phone || !dob || !gender || !address) {
      return res.json({ success: false, message: "Data Missing" });
    }

    // Parse address correctly
    const parsedAddress =
      typeof address === "string" ? JSON.parse(address) : address;

    // Prepare update data
    const updateData = {
      name,
      phone,
      address: parsedAddress,
      dob,
      gender,
    };

    // Upload image to Cloudinary if provided
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      updateData.image = imageUpload.secure_url;
    }

    // Debugging logs
    // console.log("Updating user with ID:", userId);
    // console.log("Update Data:", updateData);

    // Update user profile
    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.json({
        success: false,
        message: "User not found or update failed",
      });
    }

    // console.log("Updated User:", updatedUser);
    res.json({ success: true, message: "Profile Updated", data: updatedUser });
  } catch (err) {
    console.log("Error updating profile:", err);
    return res.json({ success: false, message: err.message });
  }
};

//api to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    // Check if the user already has an appointment at the same time
    const existingAppointment = await appointmentModel.findOne({
      userId,
      slotDate,
      slotTime,
    });

    if (existingAppointment) {
      return res.json({
        success: false,
        message: "You already have an appointment at this time.",
      });
    }

    const docData = await DoctorModel.findById(docId).select("-password");
    if (!docData.available) {
      return res.json({ success: false, message: "Doctor Not Available" });
    }

    let slots_booked = docData.slots_booked;

    // Check if the slot is already booked
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slot Not Available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await UserModel.findById(userId).select("-password");

    delete docData.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // Save new slots data in docData
    await DoctorModel.findByIdAndUpdate(docId, { slots_booked }, { new: true });

    res.json({ success: true, message: "Appointment Booked" });
  } catch (err) {
    console.log("Error booking appointment:", err);
    return res.json({ success: false, message: err.message });
  }
};

// api to get user appointments

const listAppointments = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (err) {
    console.log(err);
  }
};

// api to cancel appointment
const cancelAppointment = async () => {};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointments,
};
