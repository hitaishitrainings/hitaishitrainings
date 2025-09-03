const express = require("express");
const multer = require("multer");
const cors = require("cors");
const nodemailer = require("nodemailer");
const router = express.Router();
const db = require("../db"); // Import the database connection
const path = require("path");
const fs = require("fs");



  // ✅ Auto-create table if not exists
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS resume_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(100) NOT NULL,
      filename VARCHAR(255),
      filepath VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

 db.query(createTableQuery, (err) => {
    if (err) {
      console.error("❌ Error creating table:", err);
    } else {
      console.log("✅ resume_submissions table is ready.");
    }
  });


// ✅ Resume Upload Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + cleanName);
  }
});
const upload = multer({ storage });

// ✅ Email Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "konukatiakhila12@gmail.com",
    pass: "ppwo jgat nvza nkmd" // Use your actual app password here
  }
});

// ✅ API: Submit Resume
router.post("/submit-resume", upload.single("resume"), (req, res) => {
  const { email } = req.body;
  const resume = req.file;

  if (!email || !resume) {
    return res.json({ success: false, message: "Missing email or file." });
  }

const filePath = path.resolve("uploads", resume.filename); // ✅ Correct path

  // ✅ Insert into MySQL
  const insertQuery = "INSERT INTO resume_submissions (email, filename, filepath) VALUES (?, ?, ?)";
  db.query(insertQuery, [email, resume.originalname, resume.path], (err) => {
    if (err) {
      console.error("❌ DB Insert Error:", err);
      return res.json({ success: false, message: "Database error." });
    }

    // ✅ Email to reviewer
    const teamMail = {
      from: '"Hitaishi Bot" <yourgmail@gmail.com>',
      to: "review@hitaishi.in",
      subject: "New Resume Submitted",
      html: `<p><strong>${email}</strong> has submitted a resume for review.</p>`,
      attachments: [{ filename: resume.originalname, path: filePath }]
    };

    // ✅ Confirmation to user
    const userMail = {
      from: '"Hitaishi Trainings" <yourgmail@gmail.com>',
      to: email,
      subject: "We Received Your Resume!",
      html: `<p>Hi,<br>Thank you for submitting your resume. Our experts will get back to you soon.<br><br>Regards,<br>Hitaishi Trainings</p>`
    };

    Promise.all([
      transporter.sendMail(teamMail),
      transporter.sendMail(userMail)
    ])
    .then(() => res.json({ success: true }))
    .catch((emailErr) => {
      console.error("❌ Email error:", emailErr);
      res.json({ success: false, message: "Email sending failed." });
    });
  });
});
module.exports = router;

