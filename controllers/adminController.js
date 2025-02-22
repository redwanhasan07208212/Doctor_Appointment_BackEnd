import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import DoctorModel from "../models/doctorModels.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";

const addDoctor = async (req, res) => {
  try {
    // console.log("Request Body:", req.body);
    // console.log("Request File:", req.file);

    const requestData = req.body.data ? JSON.parse(req.body.data) : req.body;
    // console.log(requestData);
    const {
      name,
      email,
      password,
      experience,
      speciality,
      degree,
      fees,
      address,
      about,
    } = requestData;

    const imageFile = req.file;

    // Ensure all required fields are present
    if (
      !name ||
      !email ||
      !password ||
      !experience ||
      !speciality ||
      !degree ||
      !fees ||
      !address ||
      !about
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // Validate Email
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please Enter a valid Email",
      });
    }

    // Validate strong password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Parse address from JSON string if needed
    const parsedAddress =
      typeof address === "string" ? JSON.parse(address) : address;

    // Ensure an image is uploaded
    if (!imageFile) {
      return res.json({ success: false, message: "Please upload an image" });
    }

    // Check if doctor with the same email already exists
    const existingDoctor = await DoctorModel.findOne({ email });
    if (existingDoctor) {
      return res.json({
        success: false,
        message: "Doctor with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_SALT_ROUNDS)
    );

    // Upload image to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });

    const doctorData = new DoctorModel({
      name,
      email,
      image: imageUpload.secure_url,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: parsedAddress,
      date: Date.now(),
    });

    await doctorData.save();

    return res.json({ success: true, message: "Doctor Added Successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      // Duplicate key error (email already exists)
      return res.json({
        success: false,
        message: "Doctor with this email already exists",
      });
    }
    return res.json({ success: false, message: err.message });
  }
};

// api for the admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
};

// api to get all doctor list

const allDoctors = async (req, res) => {
  try {
    const doctors = await DoctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
};

// api to get all appointment list

const appointmentList = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
};

// cancel the appointment for admin

const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    await appointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        cancelled: true,
      },
      { new: true }
    );

    // Releasing doctor slot
    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await DoctorModel.findById(docId);

    let slots_booked = doctorData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );

    await DoctorModel.findByIdAndUpdate(docId, { slots_booked }, { new: true });

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentList,
  appointmentCancel,
};
