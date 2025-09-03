const fs = require("fs");
const path = require("path");
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/translate"; // Your server must be running
const LANG_DIR = path.join(__dirname, "lang");

// All languages you want
const languages = ["hi", "te", "ta", "kn", "ml", "mr", "gu", "bn", "ur"];

// English base (you can expand with all keys you want)
const baseContent = {
  title: "Welcome to Hitaishi Trainings",
  description: "Learn from the best trainers with flexible schedules."
};

async function translateText(text, lang) {
  try {
    const res = await axios.get(BASE_URL, {
      params: { text, lang }
    });
    return res.data.translated;
  } catch (err) {
    console.error(`❌ Error translating to ${lang}:`, err.message);
    return text; // fallback
  }
}

async function generateLangFiles() {
  if (!fs.existsSync(LANG_DIR)) {
    fs.mkdirSync(LANG_DIR);
  }

  // Save English reference file
  fs.writeFileSync(
    path.join(LANG_DIR, "en.json"),
    JSON.stringify(baseContent, null, 2),
    "utf-8"
  );

  for (const lang of languages) {
    const translatedObj = {};
    for (const key of Object.keys(baseContent)) {
      translatedObj[key] = await translateText(baseContent[key], lang);
    }

    fs.writeFileSync(
      path.join(LANG_DIR, `${lang}.json`),
      JSON.stringify(translatedObj, null, 2),
      "utf-8"
    );

    console.log(`✅ ${lang}.json generated`);
  }
}

generateLangFiles();
