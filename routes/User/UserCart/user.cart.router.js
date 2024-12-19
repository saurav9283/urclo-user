const express = require('express');
const { AddToCartController, RemoveFromCartController, GetCartController, GetCOuntCartController } = require('./user.cart.controller');

const router = express.Router();

router.post('/add-to-cart',AddToCartController);
router.put('/remove-from-cart',RemoveFromCartController);
router.get('/get-cart',GetCartController);
router.get('/get-cart/count',GetCOuntCartController);

module.exports = router;
