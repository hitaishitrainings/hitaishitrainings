const express = require("express");
const nodemailer = require("nodemailer");
const db = require("../db"); // Import the database connection
const router = express.Router();


// POST Route with DB insert and Email sending
router.post("/contact", (req, res) => {
    const { name, email, phone, course, message } = req.body;

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            course VARCHAR(100),
            message TEXT NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createTableQuery, (err) => {
        if (err) return res.status(500).json({ message: "DB table creation failed." });

        const insertQuery = `
            INSERT INTO contact_messages (name, email, phone, course, message)
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(insertQuery, [name, email, phone, course, message], async (err, result) => {
            if (err) return res.status(500).json({ message: "DB insertion failed." });

            // ✅ Send Email
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "konukatiakhila12@gmail.com",      // Your Gmail
                        pass: "ppwo jgat nvza nkmd"         // App Password (not your actual Gmail password)
                    }
                });

                const mailOptions = {
                    from: '"Hitaishi Support" <yourgmail@gmail.com>',
                    to: email,
                    subject: "Thanks for contacting us!",
                    html: `
                        <p>Dear ${name},</p>
                        <p>Thanks for reaching out to us!</p>
                        <p>We’ve received your message regarding <strong>${course || "General Inquiry"}</strong>.</p>
                        <p>Our team will get back to you within 24 hours.</p>
                        <hr>
                        <p><strong>Your Message:</strong><br>${message}</p>
                        <br>
                        <p>Regards,<br>Hitaishi Team</p>
                    `
                };

                await transporter.sendMail(mailOptions);
                res.status(200).json({ message: "Message saved and email sent successfully!" });

            } catch (emailErr) {
                console.error("Email error:", emailErr);
                res.status(200).json({ message: "Message saved, but failed to send email." });
            }
        });
    });
});

module.exports = router;
