import DoctorModel from "../models/doctorModels.js";

const changeAvailablity = async (req, res) => {
  try {
    const { docId } = req.body;

    const docData = await DoctorModel.findById(docId);
    await DoctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    return res.json({ success: true, message: "Availability Changed" });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
};

const doctorList = async (req, res) => {
  try {
    const doctors = await DoctorModel.find({}).select(["-password", "-email"]);
    return res.json({ success: true, doctors });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: err.message });
  }
};

export { changeAvailablity, doctorList };
