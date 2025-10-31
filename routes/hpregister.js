const express = require("express");
const router = express.Router();
const db = require("../db");

// Helper function for database queries with promise/await
const queryDB = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

// ✅ Step 1: Register User (UPDATED for Aadhaar Number)
router.post("/npregister", async (req, res) => {
  // Destructure all expected fields, including the new Aadhaar Number
  const { 
    name, email, password, phone, user_type, aadhaar_number,
    address_line1, zip_code, country, state, district, mandal, village 
  } = req.body;

  if (!name || !email || !password || !user_type || !address_line1 || !zip_code || !country || !state || !district || !village || !aadhaar_number) {
    return res.json({ success: false, message: "All required fields must be filled, including Aadhaar and the full address." });
  }

  // Create main users table if not exists (including all new columns for fresh databases)
  const createnonprofitTable = `
    CREATE TABLE IF NOT EXISTS nonprofit (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      aadhaar_number VARCHAR(12) UNIQUE NULL, -- NEW FIELD
      age INT NULL, -- NEW COMMON FIELD
      address_line1 VARCHAR(255) NULL,
      zip_code VARCHAR(10) NULL,
      country VARCHAR(100) NULL,
      state VARCHAR(100) NULL,
      district VARCHAR(100) NULL,
      mandal VARCHAR(100) NULL,
      village VARCHAR(100) NULL,
      user_type ENUM('Trainer','Manager','Donor','Student','Adult') NOT NULL,
      gender ENUM('Male', 'Female', 'Other') NULL,
      profile_image VARCHAR(255) NULL,
      profile_complete BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // SQL to enforce the correct ENUM definition for 'user_type'
  const alterEnumSql = `             
    ALTER TABLE nonprofit 
    MODIFY user_type ENUM('Trainer','Manager','Donor','Student','Adult') NOT NULL;
  `;

  // SQL to add new address columns and profile fields if they don't exist (handles migration)
  const alterColumnsSql = [
      // Add profile fields (from previous requests)
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS gender ENUM('Male', 'Female', 'Other') NULL",
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) NULL",
      // Add new required fields
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12) UNIQUE NULL", // NEW
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS age INT NULL", // NEW
      // Address fields
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255) NULL",
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10) NULL",
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL",
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL",
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS district VARCHAR(100) NULL",
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS mandal VARCHAR(100) NULL",
      "ALTER TABLE nonprofit ADD COLUMN IF NOT EXISTS village VARCHAR(100) NULL"
  ];

  try {
    // 1. Ensure the table is created
    await queryDB(createnonprofitTable);
    
    // 2. Ensure ENUM is updated
    await queryDB(alterEnumSql);

    // 3. Ensure all new columns exist
    for (const sql of alterColumnsSql) {
        // Execute each ALTER, suppressing errors if column already exists
        await queryDB(sql).catch(e => {
            if (!e.message.includes("already exists")) {
                console.error("Non-critical ALTER error:", e);
            }
        });
    }

  } catch (err) {
    console.error("Critical error during table creation/alteration:", err);
    return res.json({ success: false, message: "Database setup error. Cannot proceed with registration." });
  }

  // Insert into nonprofit table with new structured fields, including Aadhaar
  const sql = `
    INSERT INTO nonprofit (
      name, email, password, phone, user_type, profile_complete, aadhaar_number,
      address_line1, zip_code, country, state, district, mandal, village
    ) 
    VALUES (?, ?, ?, ?, ?, false, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    name, email, password, phone, user_type, aadhaar_number,
    address_line1, zip_code, country, state, district, mandal, village
  ];

  try {
    const result = await queryDB(sql, params);
    res.json({ success: true, userId: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.json({ success: false, message: "Email or Aadhaar number already registered" });
    }
    console.error(err);
    return res.json({ success: false, message: "Database error during user insertion." });
  }
});

// ✅ Step 2: Profile Completion (UPDATED for Age, Adult fields)
router.post("/npcomplete-profile", async (req, res) => {
  const { userType, data } = req.body;
  const userId = data.userId;
  // Common fields including the NEW Age field
  const { gender, profile_image, age } = data; 

  if (!userType || !userId || !age) {
    return res.json({ success: false, message: "Invalid request or Age is missing." });
  }

  let createTable, sql, params;

  // 1. Define type-specific table and fields
  switch (userType) {
    case "Trainer":
      createTable = `
        CREATE TABLE IF NOT EXISTS trainer_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          skills TEXT,
          experience VARCHAR(100),
          certifications TEXT,
          FOREIGN KEY (user_id) REFERENCES nonprofit(id) ON DELETE CASCADE
        )
      `;
      sql = `INSERT INTO trainer_profiles (user_id, skills, experience, certifications) VALUES (?, ?, ?, ?)`;
      params = [userId, data.skills, data.experience, data.certifications];
      break;

    case "Manager":
      createTable = `
        CREATE TABLE IF NOT EXISTS manager_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          organization_name VARCHAR(255),
          role VARCHAR(100),
          programs_managed TEXT,
          FOREIGN KEY (user_id) REFERENCES nonprofit(id) ON DELETE CASCADE
        )
      `;
      sql = `INSERT INTO manager_profiles (user_id, organization_name, role, programs_managed) VALUES (?, ?, ?, ?)`;
      params = [userId, data.organization_name, data.role, data.programs_managed];
      break;

    case "Donor":
      createTable = `
        CREATE TABLE IF NOT EXISTS donor_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          donation_preference VARCHAR(255),
          cause_program TEXT,
          FOREIGN KEY (user_id) REFERENCES nonprofit(id) ON DELETE CASCADE
        )
      `;
      sql = `INSERT INTO donor_profiles (user_id, donation_preference, cause_program) VALUES (?, ?, ?)`;
      params = [userId, data.donation_preference, data.cause_program];
      break;

    case "Student":
      createTable = `
        CREATE TABLE IF NOT EXISTS student_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          education VARCHAR(255),
          skills TEXT,
          FOREIGN KEY (user_id) REFERENCES nonprofit(id) ON DELETE CASCADE
        )
      `;
      sql = `INSERT INTO student_profiles (user_id, education, skills) VALUES (?, ?, ?)`;
      params = [userId, data.education, data.skills];
      break;
      
    case "Adult": 
      // UPDATED: Added monthly_income and education_level
      createTable = `
        CREATE TABLE IF NOT EXISTS adults_profiles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          occupation VARCHAR(255),
          interests TEXT,
          monthly_income INT NULL, 
          education_level ENUM('Illiterate', 'Primary', 'Secondary') NULL,
          FOREIGN KEY (user_id) REFERENCES nonprofit(id) ON DELETE CASCADE
        )
      `;
      // Check for column existence (useful during development/migration)
      const alterAdultColumnsSql = [
        "ALTER TABLE adults_profiles ADD COLUMN IF NOT EXISTS monthly_income INT NULL",
        "ALTER TABLE adults_profiles ADD COLUMN IF NOT EXISTS education_level ENUM('Illiterate', 'Primary', 'Secondary') NULL"
      ];
      try {
        await queryDB(createTable);
        for (const sql of alterAdultColumnsSql) {
            await queryDB(sql).catch(e => {
                if (!e.message.includes("already exists")) {
                    console.error("Non-critical ALTER error:", e);
                }
            });
        }
      } catch (e) {
         console.error("Adults profile table setup failed:", e);
      }

      // UPDATED: Insertion includes new fields
      sql = `INSERT INTO adults_profiles (user_id, occupation, interests, monthly_income, education_level) VALUES (?, ?, ?, ?, ?)`;
      params = [userId, data.occupation, data.interests, data.monthly_income, data.education_level];
      break;

    default:
      return res.json({ success: false, message: "Invalid user type" });
  }

  try {
    // 2. Update common fields (gender, profile_image, and NEW age) and profile_complete status in the main nonprofit table
    const updateMainSql = `
      UPDATE nonprofit 
      SET gender = ?, profile_image = ?, age = ?, profile_complete = true 
      WHERE id = ?
    `;
    // NOTE: `age` is now included in the common update parameters
    await queryDB(updateMainSql, [gender, profile_image, age, userId]);

    // 3. Ensure type-specific table exists (for Trainer/Manager/Donor/Student/Adult)
    // NOTE: Adult table creation is handled inside its case block to execute column alters immediately after creation.
    if (userType !== "Adult") {
        await queryDB(createTable);
    }
    
    // 4. Insert type-specific profile data
    await queryDB(sql, params);

    res.json({ success: true, message: "Profile completed successfully" });

  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Failed to save profile details. Database error." });
  }
});

// ✅ Step 3: Login (No changes needed)
router.post("/nplogin", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Email and password required" });
  }

  const sql = "SELECT * FROM nonprofit WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: "Database error" });
    }
    if (results.length === 0) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const user = results[0];
    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
        profile_complete: user.profile_complete
      }
    });
  });
});

// ✅ Step 4: Fetch User Dashboard Data (UPDATED for Aadhaar, Age, and Adult fields)
router.get("/npget-user-dashboard/:userId/:userType", async (req, res) => {
  const { userId, userType } = req.params;

  let profileTable, profileColumns;

  // Determine the profile table and columns based on user type
  switch (userType) {
    case "Trainer":
      profileTable = "trainer_profiles";
      profileColumns = "T.skills, T.experience, T.certifications";
      break;
    case "Manager":
      profileTable = "manager_profiles";
      profileColumns = "M.organization_name, M.role, M.programs_managed";
      break;
    case "Donor":
      profileTable = "donor_profiles";
      profileColumns = "D.donation_preference, D.cause_program";
      break;
    case "Student":
      profileTable = "student_profiles";
      profileColumns = "S.education, S.skills AS student_skills"; 
      break;
    case "Adult":
      profileTable = "adults_profiles";
      // UPDATED: Added monthly_income and education_level
      profileColumns = "A.occupation, A.interests, A.monthly_income, A.education_level";
      break;
    default:
      return res.json({ success: false, message: "Invalid user type" });
  }

  // Use a LEFT JOIN to combine the main user data with the specific profile data
  const sql = `
    SELECT 
      U.id, U.name, U.email, U.phone, U.user_type, U.profile_complete, 
      U.gender, U.profile_image, U.aadhaar_number, U.age, -- NEW FIELDS
      -- ADDRESS FIELDS
      U.address_line1, U.zip_code, U.country, U.state, U.district, U.mandal, U.village,
      ${profileColumns}
    FROM 
      nonprofit U
    LEFT JOIN 
      ${profileTable} ${profileTable.substring(0, 1)} 
    ON 
      U.id = ${profileTable.substring(0, 1)}.user_id
    WHERE 
      U.id = ? AND U.user_type = ?
  `;
  
  try {
    const results = await queryDB(sql, [userId, userType]);

    if (results.length === 0) {
      return res.json({ success: false, message: "User not found or profile incomplete" });
    }

    res.json({ success: true, user: results[0] });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Database error fetching dashboard data" });
  }
});

// ✅ Step 5: NEW ROUTE TO FETCH ALL USERS
router.get("/npget-all-users", async (req, res) => {
  const sql = `
    SELECT 
      id, name, email, phone, user_type, profile_complete, aadhaar_number, age, 
      state, district, village, created_at
    FROM 
      nonprofit
    ORDER BY 
      id DESC
  `;
  
  try {
    const results = await queryDB(sql);

    res.json({ 
        success: true, 
        users: results 
    });

  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ success: false, message: "Database error fetching user list." });
  }
});


module.exports = router;
