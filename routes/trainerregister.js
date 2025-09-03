const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const db = require("../db");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =================== Ensure uploads folder exists ===================
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// =================== Multer setup for file upload ===================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// =================== Create table if not exists (with profile_image) ===================
db.query(`
  CREATE TABLE IF NOT EXISTS trainers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    dob DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    address TEXT,
    qualification VARCHAR(100),
    experience INT,
    skills TEXT,
    certifications TEXT,
    linkedin VARCHAR(255),
    profile_image VARCHAR(255)
  )
`, (err) => {
  if (err) console.error("❌ Error creating trainers table:", err);
  else console.log("✅ Trainers table ready with profile_image field");
});

// =================== Register trainer ===================
router.post("/register-trainer", (req, res) => {
  const { name, email, password } = req.body;
  const trainerId = "TID-" + uuidv4().slice(0, 8);

  db.query("SELECT * FROM trainers WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).send("Server error");
    if (result.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    db.query(
      "INSERT INTO trainers (id, name, email, password) VALUES (?, ?, ?, ?)",
      [trainerId, name, email, password],
      (err) => {
        if (err) return res.status(500).send("Insert failed");
        res.json({ success: true, message: "Trainer registered", id: trainerId });
      }
    );
  });
});

// =================== Trainer login ===================
router.post("/login-trainer", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM trainers WHERE email = ?", [email], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: "Trainer not found" });
    }

    const trainer = results[0];
    if (trainer.password !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // ✅ Use profile_image column
let profileImage = trainer.profile_image;
if (profileImage) {
  // Ensure path starts with "uploads/"
  if (!profileImage.startsWith("uploads/")) {
    profileImage = "uploads/" + profileImage;
  }
  profileImage = `http://localhost:5000/${profileImage}`;
} else {
  profileImage = "http://localhost:5000/uploads/default-trainer.png";
}

res.json({
  success: true,
  id: trainer.id,
  name: trainer.name,
  email: trainer.email,
  profileImage
});

  });
});



// =================== Complete trainer profile (with image upload) ===================
router.post("/complete-trainer-profile", upload.single("profileImage"), (req, res) => {
  const {
    trainerId, dob, gender, phone, address,
    qualification, experience, skills,
    certifications, linkedin
  } = req.body;

  let profileImage = null;
  if (req.file) {
    profileImage = req.file.filename; // store only filename in DB
  }

  let query = `
    UPDATE trainers SET
      dob = ?, gender = ?, phone = ?, address = ?,
      qualification = ?, experience = ?, skills = ?,
      certifications = ?, linkedin = ?
  `;
  const values = [
    dob, gender, phone, address,
    qualification, experience, skills,
    certifications, linkedin
  ];

  if (profileImage) {
    query += `, profile_image = ?`;
    values.push(profileImage);
  }

  query += ` WHERE id = ?`;
  values.push(trainerId);

  db.query(query, values, (err) => {
    if (err) {
      console.error("Profile update error:", err);
      return res.status(500).json({ error: "Failed to update profile" });
    }
    res.json({ success: true, message: "Profile updated successfully" });
  });
});

// =================== Get trainer ===================
router.get("/get-trainer/:id", (req, res) => {
  const trainerId = req.params.id;

  db.query("SELECT * FROM trainers WHERE id = ?", [trainerId], (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (results.length === 0) return res.status(404).json({ error: "Trainer not found" });

    const trainer = results[0];

    // Return only filename for frontend to construct full URL
    if (trainer.profile_image) {
      trainer.profileImage = trainer.profile_image;
    } else {
      trainer.profileImage = null;
    }

    res.json({ success: true, trainer });
  });
});

// =================== Reset trainer password ===================
router.post("/reset-trainer-password", (req, res) => {
  const { email, newPassword } = req.body;

  db.query("SELECT * FROM trainers WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (results.length === 0) return res.status(404).json({ error: "Email not found" });

    db.query("UPDATE trainers SET password = ? WHERE email = ?", [newPassword, email], (err) => {
      if (err) return res.status(500).json({ error: "Could not update password" });
      res.json({ success: true, message: "Password updated" });
    });
  });
});

// =================== All trainer courses (with trainer name) ===================
router.get('/all-trainer-courses', (req, res) => {
  const query = `
    SELECT c.*, t.name AS trainer_name
    FROM courses c
    LEFT JOIN trainers t ON c.trainerId = t.id
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: "DB error" });
    res.json({ success: true, courses: results });
  });
});


// =================== Serve uploaded images ===================
router.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// Get all trainers

router.get("/", (req, res) => {
  db.query(
    "SELECT id, name, qualification AS expertise, profile_image AS profileImage FROM trainers",
    (err, result) => {
      if (err) {
        console.error("❌ DB error:", err);
        return res.status(500).json({ error: "Database query failed" });
      }

      // Add default rating + reviews (since no columns exist yet)
      const trainers = result.map(t => ({
        ...t,
        rating: 4.5,          // default rating
        reviewsCount: 50      // default reviews
      }));

      res.json(trainers);
    }
  );
});

// Get trainer by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT id, name, dob, gender, phone, address, qualification AS expertise, experience, skills, certifications, linkedin, profile_image AS profileImage FROM trainers WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("❌ DB error:", err);
        return res.status(500).json({ error: "Database query failed" });
      }
      if (result.length === 0) return res.status(404).json({ error: "Trainer not found" });

      const trainer = {
        ...result[0],
        rating: 4.5,
        reviewsCount: 50
      };

      res.json(trainer);
    }
  );
});



// Get courses by trainer
router.get("/:id/courses", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM courses WHERE trainerId = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});
module.exports = router;
