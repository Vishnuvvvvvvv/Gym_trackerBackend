import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded from jwt token ", decoded);
    req.user = decoded; // Adds user ID and other payload data to req.user
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
