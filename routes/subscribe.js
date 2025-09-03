const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const db = require("../db"); // Import the database connection

const path = require("path");
router.get("/api/lang/:code", (req, res) => {
  const filePath = path.join(__dirname, "lang", `${req.params.code}.json`);
  res.sendFile(filePath);
});


router.post("/subscribe", (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required." });

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createTableQuery, (err) => {
        if (err) return res.status(500).json({ message: "DB setup failed." });

        const insertQuery = `INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)`;
        db.query(insertQuery, [email], async (err, result) => {
            if (err) return res.status(500).json({ message: "DB insert failed." });

            try {
                // Send confirmation email
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "konukatiakhila12@gmail.com",
                        pass: "ppwo jgat nvza nkmd" // Use your actual app password here
                    }
                });

                const mailOptions = {
                    from: '"Hitaishi Team" <yourgmail@gmail.com>',
                    to: email,
                    subject: "You've Subscribed to Hitaishi Newsletter!",
                    html: `
                        <p>Hi there!</p>
                        <p>Thanks for subscribing to the Hitaishi newsletter. Stay tuned for course updates, job tips, and resources!</p>
                        <br>
                        <p>Regards,<br>The Hitaishi Team</p>
                    `
                };

                await transporter.sendMail(mailOptions);
                res.status(200).json({ message: "Subscribed successfully! Confirmation email sent." });

            } catch (err) {
                console.error("Email send error:", err);
                res.status(200).json({ message: "Subscribed, but failed to send confirmation email." });
            }
        });
    });
});

module.exports = router;
