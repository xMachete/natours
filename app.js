const path = require('path');
const express = require('express');
const morgan = require('morgan');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const globarErrorController = require('./controllers/errorController');
const AppError = require('./utils/appError');
const cookieParser = require('cookie-parser');

//Start express aplication
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const tourRouter = require(`./routs/tourRouts`);
const userRouter = require(`./routs/userRouts`);
const reviewRouter = require('./routs/reviewRouts');
const viewRouter = require('./routs/viewRouts');

//1)MIDLEWARES

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));
//Set security HTTP headers
app.use(helmet());

//development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//Body parser, reading data from body into req.body
//Parsing data from cookies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kbx' }));
app.use(cookieParser());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against XSS attacks
app.use(xss());
//Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
// Content Security Policy, whitelistuje axios biblioteku sa cdnjs sajta
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://cdnjs.cloudflare.com"
  );
  next();
});

//2)ROUT HANDLERS, takodje vrsta middlewera ali zadnja u lancu jer vraca response

// app.get('/api/v1/tours/', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch(`/api/v1/tours/:id`, updateTour);
// app.delete(`/api/v1/tours/:id`, deleteTour);

//3)ROUTS

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // Mounting router
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); //error objekat
});

app.use(globarErrorController);
module.exports = app;
