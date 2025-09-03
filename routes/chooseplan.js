const express = require("express");
const router = express.Router();
const db = require("../db"); // Import the database connection
const nodemailer = require("nodemailer");
router.post("/choose-plan", (req, res) => {
  const { userId, plan, price } = req.body;

  if (!userId || !plan || !price) {
    console.error("Missing fields:", { userId, plan, price });
    return res.status(400).json({ message: "Missing required fields." });
  }

 const createTableQuery = `
  CREATE TABLE IF NOT EXISTS resume_service_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;


  db.query(createTableQuery, (err) => {
    if (err) {
      console.error("Create table error:", err.sqlMessage || err);
      return res.status(500).json({ message: "DB setup error", error: err.sqlMessage });
    }

    const insertQuery = `INSERT INTO resume_service_orders (user_id, plan, price) VALUES (?, ?, ?)`;
    db.query(insertQuery, [userId, plan, price], (err, result) => {
      if (err) {
        console.error("Insert error:", err.sqlMessage || err);
        return res.status(500).json({ message: "Insert failed", error: err.sqlMessage });
      }

      res.status(200).json({ message: "Plan successfully selected!" });
    });
  });
});

router.post('/send-plan-email', async (req, res) => {
  const { email, planName, price, features } = req.body;

  // Configure your mail transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'konukatiakhila12@gmail.com',     // Replace with your email
      pass: 'ppwo jgat nvza nkmd'         // Use app password (not regular one)
    }
  });

  const mailOptions = {
    from: '"Hitaishi Trainings" <your-email@gmail.com>',
    to: email,
    subject: `You've selected the ${planName} Plan`,
    html: `
      <h2>Thank you for choosing the ${planName} Plan</h2>
      <p><strong>Price:</strong> ${price}</p>
      <p><strong>Features:</strong></p>
      <ul>${features.map(f => `<li>${f}</li>`).join('')}</ul>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});
router.post("/plan-email", async (req, res) => {
    const { email, plan } = req.body;

    if (!email || !plan) {
        return res.status(400).json({ message: "Missing email or plan type" });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", // or use SMTP config
            auth: {
                user: "konukatiakhila12@gmail.com",
                pass: "ppwo jgat nvza nkmd"
            }
        });

        const mailOptions = {
            from: "your_email@gmail.com",
            to: email,
            subject: `Hitaishi Training - ${plan} Plan Confirmation`,
            html: `
                <h2>Thank you for choosing the ${plan} plan!</h2>
                <p>We’ve received your interest and will get in touch shortly.</p>
                <p>If you have any questions, feel free to reply to this email.</p>
                <br />
                <strong>Hitaishi Training Team</strong>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.error("Error sending mail:", error);
        res.status(500).json({ message: "Failed to send email" });
    }
});

module.exports = router;
