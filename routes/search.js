const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * @route GET /api/search
 * @description Searches for trainers and courses based on a keyword.
 * @query q - The search keyword.
 */
router.get("/search", (req, res) => {
  // Use 'q' as the standard query parameter name for search
  const keyword = req.query.q || "";

  // --- Trainers query ---
  // Selects trainer details including their skills (used as expertise)
  const trainerQuery = `
    SELECT 
      id, 
      name, 
      qualification, 
      experience, 
      IF(profile_image IS NULL OR profile_image = '', '/images/default_trainer.png', profile_image) AS profileImage,
      skills  /* This field is used as 'Expertise' on the frontend */
    FROM trainers
    WHERE name LIKE ? OR skills LIKE ? OR qualification LIKE ?
  `;

  // --- Courses query ---
  // Selects course details including the course title and associated trainer info
  const courseQuery = `
    SELECT 
      c.id AS courseId,
      c.title, /* Correct field name for course title */
      c.description,
      c.mode,
      c.duration,
      c.fee,
      c.trainerId,
      IF(t.profile_image IS NULL OR t.profile_image='', '/images/default_trainer.png', t.profile_image) AS trainerImage,
      t.name AS trainerName
    FROM courses c
    LEFT JOIN trainers t ON c.trainerId = t.id
    WHERE c.title LIKE ? OR c.description LIKE ?
    ORDER BY c.createdAt DESC
  `;

  // Execute Trainer Search
  db.query(trainerQuery, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`], (err, trainers) => {
    if (err) {
      console.error("Trainer search error:", err);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    // Execute Course Search
    db.query(courseQuery, [`%${keyword}%`, `%${keyword}%`], (err, courses) => {
      if (err) {
        console.error("Course search error:", err);
        return res.status(500).json({ success: false, error: "Database error" });
      }

      // Note: timeSlots parsing logic was removed as it was incomplete and caused issues.
      // Assuming timeSlots is not critical for basic search display.

      // Send combined results
      res.json({
        success: true,
        trainers,
        courses
      });
    });
  });
});

module.exports = router;
