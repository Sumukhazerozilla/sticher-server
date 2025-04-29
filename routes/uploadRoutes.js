const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { processZipFile, generateFileId } = require("../utils/fileProcessor");
const {
  storeProcessedFile,
  getProcessedFile,
  listProcessedFiles,
} = require("../utils/storage");
const multer = require("multer");

/**
 * POST /api/upload
 * Uploads and processes a ZIP file
 */
router.post("/upload", (req, res) => {
  upload.single("zipFile")(req, res, async function (err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ error: "Upload failed", details: err.message });
      } else {
        return res
          .status(500)
          .json({ error: "Server error", details: err.message });
      }
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No ZIP file uploaded" });
      }

      const processedData = await processZipFile(req.file);
      const fileId = generateFileId();

      // Store the processed data with the generated ID
      storeProcessedFile(fileId, processedData);

      // Log to confirm storage
      console.log(`File processed and stored with ID: ${fileId}`);

      res.json({
        message: "ZIP file processed successfully",
        fileId: fileId,
        metadata: processedData.metadata,
        images: processedData.imageLinks,
      });
    } catch (error) {
      console.error("Error processing ZIP file:", error);

      // Send more specific error message for validation failures
      const statusCode = error.message.startsWith("Invalid ZIP:") ? 400 : 500;
      res
        .status(statusCode)
        .json({ error: "Failed to process ZIP file", details: error.message });
    }
  });
});

/**
 * GET /api/files/:fileId
 * Retrieve data for a previously processed ZIP file
 */
router.get("/files/:fileId", (req, res) => {
  const fileId = req.params.fileId;
  console.log(`GET request for file ID: ${fileId}`);

  const fileData = getProcessedFile(fileId);

  if (!fileData) {
    return res.status(404).json({
      error: "File not found",
      id: fileId,
      message:
        "The requested file ID was not found in storage. It may have been removed or the server was restarted.",
    });
  }

  res.json({
    fileId: fileId,
    metadata: fileData.metadata,
    images: fileData.imageLinks,
    filename: fileData.filename,
    processedAt: new Date(fileData.timestamp).toISOString(),
  });
});

/**
 * GET /api/files
 * List all processed files
 */
router.get("/files", (req, res) => {
  const files = listProcessedFiles();
  console.log(`Available files: ${files.length}`);

  res.json({
    files: files,
  });
});

module.exports = router;
