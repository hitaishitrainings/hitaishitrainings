const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const db = require("../db"); // Import the database connection
const mysql = require("mysql");





  // Create table if not exists
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS webinar_registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      topic VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error("❌ Failed to create table:", err);
    } else {
      console.log("✅ Table 'webinar_registrations' is ready");
    }
  });


// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "konukatiakhila12@gmail.com",
    pass:"ppwo jgat nvza nkmd" // Use your actual app password here"
  }
});

// POST Route
router.post("/webinar-register", (req, res) => {
  const { name, email, phone, topic } = req.body;

  const query = "INSERT INTO webinar_registrations (name, email, phone, topic) VALUES (?, ?, ?, ?)";
  db.query(query, [name, email, phone, topic], (err, result) => {
    if (err) {
      console.error("❌ MySQL insert error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    // Send Email
    const mailOptions = {
      from: '"Hitaishi Trainings" <yourgmail@gmail.com>',
      to: email,
      subject: "Webinar Registration Confirmation",
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for registering for our free webinar on <strong>${topic}</strong>.</p>
        <p>We’ll send you the meeting link shortly.</p>
        <p>Regards,<br>Hitaishi Trainings Team</p>
      `
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Email error:", err);
        return res.json({ success: false, message: "Email failed to send" });
      }
      res.json({ success: true });
    });
  });
});

module.exports = router;