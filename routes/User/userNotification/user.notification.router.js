const express = require('express');
const { NotificationController, NotifiCountController } = require('./user.notification.controller');
// const {  } = require('./user.notification.controller');

const router = express.Router();

router.get('/graphql', NotificationController);
router.get('/graphql/count', NotifiCountController);

module.exports = router;
