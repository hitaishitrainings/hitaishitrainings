const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const mysql = require("mysql");

// 1. Create MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "2142",  // 🔐 replace this
  database: "hitaishi_trainings"     // ✅ use your DB name
});

// 2. Create table if not exists
connection.query(`
  CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    qualification VARCHAR(100),
    currentStudy VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zipCode VARCHAR(10),
    service TEXT,
    training TEXT,
    otherTrainingText VARCHAR(255),
    needsAddons ENUM('yes', 'no'),
    addon TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
  if (err) console.error("Error creating table:", err);
  else console.log("✅ 'enrollments' table ready.");
});

// 3. Setup email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "konukatiakhila12@gmail.com",
    pass: "ppwo jgat nvza nkmd"
  }
});

// 4. Handle form submission
router.post("/enroll", async (req, res) => {
  const {
    fullName,
    email,
    phone,
    qualification,
    currentStudy,
    address,
    city,
    state,
    zipCode,
    service,
    training,
    otherTrainingText,
    needsAddons,
    addon
  } = req.body;

  const selectedTrainings = training.join(", ") + (otherTrainingText ? `, ${otherTrainingText}` : "");
  const selectedServices = service.join(", ");
  const selectedAddons = addon.join(", ");

  // 5. Insert into DB
  const insertQuery = `
    INSERT INTO enrollments 
    (fullName, email, phone, qualification, currentStudy, address, city, state, zipCode, service, training, otherTrainingText, needsAddons, addon) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    fullName,
    email,
    phone,
    qualification,
    currentStudy,
    address,
    city,
    state,
    zipCode,
    selectedServices,
    selectedTrainings,
    otherTrainingText,
    needsAddons,
    selectedAddons
  ];

  connection.query(insertQuery, values, async (err, result) => {
    if (err) {
      console.error("Error inserting into DB:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // 6. Send confirmation email
    const mailOptions = {
      from: '"Hitaishi Training" <yourgmail@gmail.com>',
      to: email,
      subject: "Enrollment Confirmation - Hitaishi Training",
      html: `
        <h2>Hi ${fullName},</h2>
        <p>Thank you for enrolling with <strong>Hitaishi Training</strong>!</p>
        <p>Here are your submitted details:</p>
        <ul>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Qualification:</strong> ${qualification}</li>
          <li><strong>Current Study/Profession:</strong> ${currentStudy}</li>
          <li><strong>Address:</strong> ${address}, ${city}, ${state} - ${zipCode}</li>
          <li><strong>Interested Services:</strong> ${selectedServices}</li>
          <li><strong>Preferred Trainings:</strong> ${selectedTrainings}</li>
          <li><strong>Need Add-ons:</strong> ${needsAddons === "yes" ? "Yes" : "No"}</li>
          ${needsAddons === "yes" ? `<li><strong>Add-ons:</strong> ${selectedAddons}</li>` : ""}
        </ul>
        <p>We will contact you shortly with the next steps.</p>
        <p>Best Regards,<br/>Hitaishi Training Team</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "Enrollment submitted and confirmation email sent!" });
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      res.status(500).json({ message: "Submission received, but email sending failed." });
    }
  });
});

module.exports = router;
