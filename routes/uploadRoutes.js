const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { processZipFile, generateFileId } = require("../utils/fileProcessor");
const {
  storeProcessedFile,
  getProcessedFile,
  listProcessedFiles,
} = require("../utils/dbStorage");
const multer = require("multer");
const db = require("../models");

/**
 * POST /api/upload
 * Uploads and processes a ZIP file
 */
router.post("/upload", (req, res) => {
  try {
    console.log("POST request to /api/upload");

    // Apply multer with error handling
    upload.single("zipFile")(req, res, async function (err) {
      if (err) {
        console.error("Multer error:", err);
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              error: "File too large",
              details: "Maximum file size is 100MB",
            });
          }
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
          console.log("No file uploaded");
          return res.status(400).json({ error: "No ZIP file uploaded" });
        }

        console.log(
          `File received: ${req.file.originalname}, size: ${req.file.size} bytes`
        );

        const processedData = await processZipFile(req.file);
        const fileId = generateFileId();

        // Store the processed data with the generated ID
        await storeProcessedFile(fileId, processedData);

        // Log to confirm storage
        console.log(`File processed and stored with ID: ${fileId}`);

        res.json({
          message: "ZIP file processed successfully",
          fileId: fileId,
          metadata: processedData.metadata,
          images: processedData.imageLinks,
          audio: processedData?.audioPath,
        });
      } catch (error) {
        console.error("Error processing ZIP file:", error);

        // Send more specific error message for validation failures
        const statusCode = error.message.startsWith("Invalid ZIP:") ? 400 : 500;
        res.status(statusCode).json({
          error: "Failed to process ZIP file",
          details: error.message,
        });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: "Server error",
      details: "An unexpected error occurred",
    });
  }
});

/**
 * GET /api/files/:fileId
 * Retrieve data for a previously processed ZIP file
 */
router.get("/files/:fileId", async (req, res) => {
  const fileId = req.params.fileId;
  console.log(`GET request for file ID: ${fileId}`);

  try {
    const fileData = await getProcessedFile(fileId);

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
      audio: fileData.audioPath,
      filename: fileData.filename,
      processedAt: new Date(fileData.timestamp).toISOString(),
    });
  } catch (error) {
    console.error("Error retrieving file:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

/**
 * GET /api/files
 * List all processed files
 */
router.get("/files", async (req, res) => {
  try {
    const files = await listProcessedFiles();
    console.log(`Available files: ${files.length}`);

    res.json({
      files: files,
    });
  } catch (error) {
    console.error("Error listing files:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

/**
 * DELETE /api/files/:fileId
 * Delete a image from the images array
 */

router.delete("/files/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const imagePath = req?.body.filePath;
    console.log(
      `DELETE request for file ID: ${fileId}, imagePath: ${imagePath}`
    );

    const fileData = await db.ProcessedFile.findByPk(fileId);

    // console.log(`File data retrieved: ${JSON.stringify(fileData)}`);

    if (!fileData) {
      return res.status(404).json({
        error: "File not found",
        id: fileId,
        message:
          "The requested file ID was not found in storage. It may have been removed or the server was restarted.",
      });
    }

    const imageLinks = fileData?.imageLinks || [];

    const updatedImageLinks = imageLinks.filter((link) => link !== imagePath);

    // Update the file data in the database
    await fileData.update({
      imageLinks: updatedImageLinks,
    });

    res.json({
      message: "File deleted successfully",
      fileId: fileId,
      fileData,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

module.exports = router;
