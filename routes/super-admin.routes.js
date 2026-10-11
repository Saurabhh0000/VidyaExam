
const express = require("express");
const router = express.Router();

const {
    createSuperAdmin
} = require("../controller/super-admin.controller");

router.post("/createSuperAdmin", createSuperAdmin);

module.exports = router;
