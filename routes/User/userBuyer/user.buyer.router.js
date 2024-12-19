const express = require('express');
const { UserBuyerController } = require('./user.buyer.controller');

const router = express.Router();

router.post('/buy-service' , UserBuyerController)

module.exports = router;
