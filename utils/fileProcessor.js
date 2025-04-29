const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const crypto = require("crypto");
const sharp = require("sharp");

// Generate a unique file ID
const generateFileId = () => {
  return crypto.randomBytes(8).toString("hex");
};

/**
 * Process images based on custom region
 * @param {string} imagesDir Source directory containing images
 * @param {string} outputDir Output directory for processed images
 * @param {Object} customRegion Region to crop images {x, y, width, height}
 * @returns {Promise<Array>} Array of processed image paths
 */
const processImages = async (imagesDir, outputDir, customRegion) => {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const imageFiles = fs.readdirSync(imagesDir);
  const processPromises = [];
  const processedPaths = [];

  // Filter for image files
  const imagesToProcess = imageFiles.filter((file) =>
    file.match(/\.(jpg|jpeg|png|gif)$/i)
  );

  // No images to process
  if (imagesToProcess.length === 0) {
    return [];
  }

  for (const file of imagesToProcess) {
    const inputPath = path.join(imagesDir, file);
    const outputPath = path.join(outputDir, file);

    if (customRegion && customRegion.width && customRegion.height) {
      try {
        // Get image metadata first to validate crop dimensions
        const metadata = await sharp(inputPath).metadata();

        // Validate if custom region is within image bounds
        const validX = Math.min(
          Math.max(0, customRegion.x),
          metadata.width - 1
        );
        const validY = Math.min(
          Math.max(0, customRegion.y),
          metadata.height - 1
        );
        const validWidth = Math.min(
          customRegion.width,
          metadata.width - validX
        );
        const validHeight = Math.min(
          customRegion.height,
          metadata.height - validY
        );

        if (validWidth <= 0 || validHeight <= 0) {
          // If invalid dimensions, just copy the original
          console.log(
            `Skipping crop for ${file}: invalid dimensions after adjustment`
          );
          fs.copyFileSync(inputPath, outputPath);
          processedPaths.push(outputPath);
          continue;
        }

        // Process with adjusted cropping parameters
        const promise = sharp(inputPath)
          .extract({
            left: validX,
            top: validY,
            width: validWidth,
            height: validHeight,
          })
          // Maintain original quality
          .withMetadata()
          .toFile(outputPath)
          .then(() => {
            processedPaths.push(outputPath);
            console.log(`Successfully processed image: ${file}`);
          })
          .catch((err) => {
            console.error(`Error processing image ${file}:`, err);
            // Fallback to copying the original file
            fs.copyFileSync(inputPath, outputPath);
            processedPaths.push(outputPath);
          });

        processPromises.push(promise);
      } catch (err) {
        console.error(`Error getting metadata for ${file}:`, err);
        // Fallback to copying the original file
        fs.copyFileSync(inputPath, outputPath);
        processedPaths.push(outputPath);
      }
    } else {
      // Just copy the file without modifying if no customRegion
      fs.copyFileSync(inputPath, outputPath);
      processedPaths.push(outputPath);
    }
  }

  if (processPromises.length > 0) {
    await Promise.allSettled(processPromises);
  }

  return processedPaths;
};

/**
 * Processes an uploaded ZIP file
 * @param {Object} file The uploaded file object from multer
 * @returns {Object} Metadata and image links
 */
const processZipFile = async (file) => {
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

  // Validate metadata.json exists
  const metadataPath = path.join(extractDir, "metadata.json");
  if (!fs.existsSync(metadataPath)) {
    throw new Error("Invalid ZIP: metadata.json file is missing");
  }

  // Read metadata
  let metadata = null;
  try {
    const metadataContent = fs.readFileSync(metadataPath, "utf8");
    // Remove comments if they exist (some JSON files have them)
    const cleanedContent = metadataContent.replace(/\/\/.*$/gm, "");
    metadata = JSON.parse(cleanedContent);
    console.log("Metadata loaded successfully");
  } catch (error) {
    console.error("Error parsing metadata.json:", error);
    throw new Error(
      `Invalid ZIP: metadata.json parsing failed - ${error.message}`
    );
  }

  // Validate images directory exists
  const imagesDir = path.join(extractDir, "images");
  if (!fs.existsSync(imagesDir)) {
    throw new Error("Invalid ZIP: images directory is missing");
  }

  // Validate images exist in the directory
  const imageFiles = fs.readdirSync(imagesDir);
  const hasImages = imageFiles.some((file) =>
    file.match(/\.(jpg|jpeg|png|gif)$/i)
  );
  if (!hasImages) {
    throw new Error("Invalid ZIP: no image files found in images directory");
  }

  // Process images if customRegion is defined
  let outputImagesDir = path.join(extractDir, "processed_images");
  let customRegion = null;

  if (metadata.lastRecording && metadata.lastRecording.customRegion) {
    customRegion = metadata.lastRecording.customRegion;
  } else if (metadata.customRegion) {
    customRegion = metadata.customRegion;
  }

  if (customRegion) {
    console.log(
      "Found customRegion in metadata, cropping images:",
      customRegion
    );
    await processImages(imagesDir, outputImagesDir, customRegion);
  } else {
    // If no custom region, still copy images to processed_images for consistency
    await processImages(imagesDir, outputImagesDir, null);
  }

  // Get all image files from output directory
  let imageLinks = [];
  if (fs.existsSync(outputImagesDir)) {
    const processedFiles = fs.readdirSync(outputImagesDir);

    if (processedFiles.length === 0) {
      console.warn("Warning: No processed images found after processing");
    }

    // Create public URLs for each image
    imageLinks = processedFiles
      .filter((file) => file.match(/\.(jpg|jpeg|png|gif)$/i))
      .map((file) => {
        return `/assets/${folderName}/processed_images/${file}`;
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
