const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors')

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const productApiRouter = require('./api/product');
const userApiRouter = require('./api/user');
const hbs = require('express-handlebars')

const app = express();
const db = require('./config/connection')
const session= require('express-session')
const fileUpload = require('express-fileupload')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"key",cookie:{maxAge:600000000}}))
app.use((req,res,next)=>{
  res.header('Cache-Control','no-cache,private,no-Store,must-revalidate,max-scale=0,post-check=0,pre-check=0');
  next();
})
app.use(fileUpload())
app.use(cors({
  origin: ['http://localhost:4200', 'https://cara-odz2.onrender.com','https://cara-angular.netlify.app','https://carashop.shop']
}))

db.connect((err)=>{
  if(err) console.log("Connection Error");
  else console.log("Database Connected Successfully");
})

app.use('/', userRouter);
app.use('/', adminRouter);
app.use('/', productApiRouter);
app.use('/', userApiRouter);

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

app.listen(3000,()=>{
  console.log("Server is listening on 3000");
})