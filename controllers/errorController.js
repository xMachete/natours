const AppError = require('../utils/appError');

const sendErrorDev = (req, res, err) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  // B) RENDERED WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (req, res, err) => {
  //Operastional, trusted error:send message to client
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // 1) Operational,trusted error: send message to cliend
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.statusCode,
        message: err.message,
      });
    }
    // 2) Programing or other unknown error: dont leak error details
    console.log('ERROR🧨', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }

  // B) RENDERED WEBSITE
  // 1) Operational,trusted error: send message to cliend

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // 2) Programing or other unknown error: dont leak error details
  console.log('ERROR🧨', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later!',
  });
};

const handleCastErrorDB = (err) => {
  const message = `Wrong ${err._id}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  //   const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  //Dobijam drugaciji err objekat nego Jonas
  const value = err.keyValue.name;
  console.log(value);
  const message = `Duplicate field value: ${value}. Please use another one`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid data type. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token, please login again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please login again', 401);

module.exports = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV.trim() === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    // let error = { ...err };
    let error = JSON.parse(JSON.stringify(err)); //deep copy, nije optimalno

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error); // pravi se operaciona greska sa jasnom porukom korisniku
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    sendErrorProd(error, res);
  }
};
