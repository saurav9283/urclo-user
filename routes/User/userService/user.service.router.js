const express = require('express');
const { getMasterserviceController, getCategoryController, getSubCategoryController } = require('./user.service.controller');

const router = express.Router();

router.get('/' , getMasterserviceController)
router.get('/category' , getCategoryController)
router.get('/category/sub-cat' , getSubCategoryController)

module.exports = router;
