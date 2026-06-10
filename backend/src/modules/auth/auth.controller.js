const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const AppError = require('../../core/utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  user.password = undefined; // Remove password from output

  res.status(statusCode).json({
    success: true,
    message: "Operation successful",
    data: {
      token,
      user,
    },
  });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    if (!user.isActive) {
      return next(new AppError('This user account is deactivated.', 401));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Operation successful",
    data: {
      user: req.user,
    },
  });
};
