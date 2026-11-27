const express = require("express");

const { listarIssues } = require("../controllers/apiJiraController");

const router = express.Router();

router.get("/listarIssues", listarIssues);

module.exports = router;