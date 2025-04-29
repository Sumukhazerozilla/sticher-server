const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const crypto = require("crypto");

// Generate a unique file ID
const generateFileId = () => {
  return crypto.randomBytes(8).toString("hex");
};

/**
 * Processes an uploaded ZIP file
 * @param {Object} file The uploaded file object from multer
 * @returns {Object} Metadata and image links
 */
const processZipFile = (file) => {
  const zipFilePath = file.path;
  const fileName = file.filename;
  const folderName = path.parse(fileName).name;
  const extractDir = path.join(__dirname, "..", "assets", folderName);

  // Create extract directory
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }

  // Extract the ZIP file
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo(extractDir, true);

  // Read metadata.json if it exists
  let metadata = null;
  const metadataPath = path.join(extractDir, "metadata.json");
  if (fs.existsSync(metadataPath)) {
    const metadataContent = fs.readFileSync(metadataPath, "utf8");
    metadata = JSON.parse(metadataContent);
  }

  // Get all image files from images directory
  const imagesDir = path.join(extractDir, "images");
  let imageLinks = [];

  if (fs.existsSync(imagesDir)) {
    const imageFiles = fs.readdirSync(imagesDir);

    // Create public URLs for each image
    imageLinks = imageFiles
      .filter((file) => file.match(/\.(jpg|jpeg|png|gif)$/i))
      .map((file) => {
        return `/assets/${folderName}/images/${file}`;
      });
  }

  return {
    metadata,
    imageLinks,
    folderName,
    filename: file.originalname,
  };
};

module.exports = {
  processZipFile,
  generateFileId,
};
