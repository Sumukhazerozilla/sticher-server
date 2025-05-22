const db = require("../models");
const ProcessedFile = db.ProcessedFile;

/**
 * Store processed file data with a unique ID
 * @param {string} id Unique ID for the file
 * @param {Object} data Data to store
 */
const storeProcessedFile = async (id, data) => {
  console.log(`Storing file with ID: ${id}`);

  try {
    await ProcessedFile.create({
      id,
      metadata: data.metadata,
      imageLinks: data.imageLinks,
      folderName: data.folderName,
      filename: data.filename,
      audioPath: data.audioPath || null,
      timestamp: Date.now(),
    });

    console.log(`Successfully stored file with ID: ${id}`);
  } catch (err) {
    console.error("Error storing file in database:", err);
    throw err;
  }
};

/**
 * Retrieve processed file data by ID
 * @param {string} id The file ID
 * @returns {Object|null} The file data or null if not found
 */
const getProcessedFile = async (id) => {
  console.log(`Attempting to retrieve file with ID: ${id}`);

  try {
    const file = await ProcessedFile.findByPk(id);

    if (file) {
      console.log(`File found with ID: ${id}`);
      return file.toJSON();
    }

    console.log(`File NOT found with ID: ${id}`);
    return null;
  } catch (err) {
    console.error("Error retrieving file from database:", err);
    return null;
  }
};

/**
 * List all processed files (limited info)
 * @returns {Array} Array of processed file info
 */
const listProcessedFiles = async () => {
  try {
    const files = await ProcessedFile.findAll({
      attributes: ["id", "timestamp", "filename"],
    });

    return files.map((file) => file.toJSON());
  } catch (err) {
    console.error("Error listing files from database:", err);
    return [];
  }
};

module.exports = {
  storeProcessedFile,
  getProcessedFile,
  listProcessedFiles,
};
