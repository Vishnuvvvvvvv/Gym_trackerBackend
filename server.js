import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware/auth.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Enable CORS

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define a simple route
app.get("/", (req, res) => {
  res.send("🚀 Express Server is Running with ES Modules!");
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String },
});

const User = mongoose.model("User", userSchema);

// 🔹 Signup Route
app.post("/api/signup", async (req, res) => {
  console.log("🔹 Signup API called...");
  const { email, password } = req.body;
  console.log(email, " ", password);
  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Create new user
    const newUser = new User({ email, password });
    const savedUser = await newUser.save();
    const payload = { emailAdd: email };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(201).json({
      message: "User registered successfully",
      user: savedUser,
      token: token,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 Login Route
app.post("/api/login", async (req, res) => {
  console.log("🔹 Login API called...");
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check password (No encryption)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = { emailAdd: email };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(200).json({
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/edit-profile", authMiddleware, async (req, res) => {
  console.log("edit-profile called");
  const email = req.user.emailAdd;
  const { username, oldPassword, newPassword } = req.body;

  console.log("email :", email);
  console.log("req: ", username, oldPassword, newPassword);
  try {
    let updatedUser;
    if (username && username.trim()) {
      updatedUser = await User.findOneAndUpdate(
        { email },
        { username },
        { new: true, upsert: false }
      );
    }

    // Handle password update
    if (oldPassword && newPassword) {
      const user = await User.findOne({ email });

      if (oldPassword === user.password) {
        updatedUser = await User.findOneAndUpdate(
          { email },
          { password: newPassword },
          { new: true, upsert: false }
        );
      } else {
        return res.status(400).json({ message: "old password is incorrect" });
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    updatedUser = await User.findOne({ email });
    console.log("updated user", updatedUser);

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// to get the username which is stored in backend
app.get("/api/username", authMiddleware, async (req, res) => {
  const email = req.user.emailAdd;

  console.log("email :", email);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Start the server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
