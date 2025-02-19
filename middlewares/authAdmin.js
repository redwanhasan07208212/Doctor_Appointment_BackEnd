import jwt from "jsonwebtoken";

// Admin authentication middleware
const authAdmin = async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({
        success: false,
        message: "Not Authorized. Please log in again.",
      });
    }

    // Get the token from the header
    const token = authHeader.split(" ")[1]; // Format: "Bearer <token>"

    // Verify the token
    const token_decode = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Validate the decoded token payload
    if (
      token_decode.email !== process.env.ADMIN_EMAIL ||
      token_decode.password !== process.env.ADMIN_PASSWORD
    ) {
      return res.json({
        success: false,
        message: "Not Authorized. Please log in again.",
      });
    }

    // Attach the decoded token payload to the request object
    req.admin = token_decode;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error(err);

    // Handle specific JWT errors
    if (err.name === "JsonWebTokenError") {
      return res.json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    } else if (err.name === "TokenExpiredError") {
      return res.json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }

    // Generic error response
    return res.json({ success: false, message: err.message });
  }
};

export default authAdmin;
