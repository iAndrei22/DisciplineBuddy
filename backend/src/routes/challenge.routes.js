const express = require("express");
const router = express.Router();
const challengeCtrl = require("../controllers/challenge.controller");

// Get available categories
router.get("/categories", challengeCtrl.getCategories);

// Create a general challenge (coach)
router.post("/", challengeCtrl.createChallenge);

// List all general challenges
router.get("/", challengeCtrl.listChallenges);

// Get participants for a challenge
router.get("/:id/participants", challengeCtrl.getParticipants);

// Enroll user in a challenge
router.post("/:id/enroll", challengeCtrl.enrollChallenge);

// Update participant status
router.patch("/:id/status", challengeCtrl.updateParticipantStatus);

// Delete a challenge
router.delete("/:id", challengeCtrl.deleteChallenge);

module.exports = router;
