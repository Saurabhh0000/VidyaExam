const express = require("express");
const router = express.Router();

const { getSubscriptionPlans } = require("../controller/subscription.controller");

router.get("/plans", getSubscriptionPlans);

module.exports = router;