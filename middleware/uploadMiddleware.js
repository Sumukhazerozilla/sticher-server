const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "assets");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for ZIP file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename using timestamp and original name
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-");
    cb(null, `${timestamp}-${sanitizedName}`);
  },
});

// Validate that uploaded file is a ZIP
const fileFilter = (req, file, cb) => {
  console.log("Received file:", file.originalname, file.mimetype);

  if (
    file.mimetype === "application/zip" ||
    file.mimetype === "application/x-zip-compressed" ||
    file.originalname.endsWith(".zip")
  ) {
    cb(null, true);
  } else {
    console.log("Rejected file:", file.originalname, file.mimetype);
    cb(new Error("Only ZIP files are allowed"), false);
  }
};

// Configure multer with increased size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB size limit
  },
});

module.exports = upload;
