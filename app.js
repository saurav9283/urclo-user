require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var http = require('http'); 
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
const socketIO = require('socket.io');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const bodyParser = require('body-parser');
const UserBuyerRouter = require('./routes/User/userBuyer/user.buyer.router.js');
const UserRouter = require('./routes/User/userAuth/auth.router.js');
const UserCartRouter = require('./routes/User/UserCart/user.cart.router.js');
const UserNoifyRouter = require('./routes/User/userNotification/user.notification.router.js');
const userMasterCatRouter = require('./routes/User/userService/user.service.router.js');
const RabbitConnect = require('./utils/RabbitMQ .js');
const { updateOnOrderNotificationService } = require('./routes/User/userNotification/user.notification.service.js');

var app = express();
const server = http.createServer(app);

const io = socketIO(server,{
  cors: {
      origin: '*',
      methods : ['GET','POST'], 
  }
})
 
app.set('io', io);  


app.use(cors("*"));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public/images')));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
  });
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/user-auth', UserRouter);
app.use('/api/user', UserBuyerRouter);
app.use('/api/checkout/cart' , UserCartRouter);
app.use('/api', UserNoifyRouter);
app.use('/api/get/mastercat', userMasterCatRouter);

app.get('/api', (req, res) => {
  res.send("Api is working fine")
})

RabbitConnect.subscribeToQueue("order-accept", async(message) => {
  try {
    console.log('Received message: for user dashboard order accept', JSON.parse(message));
    const { user_id, providerName } = JSON.parse(message);
    await updateOnOrderNotificationService(user_id, providerName);
  } catch (error) {
    console.error('Error processing RabbitMQ message:', error);
  }
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

RabbitConnect.connect();

const PORT = "5656";
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})

module.exports = app;