const User = require('./user.model');
const AppError = require('../../core/utils/appError');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ clinicId: req.clinicId }).select('-password');
    res.status(200).json({
      success: true,
      results: users.length,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const newUser = await User.create({
      clinicId: req.clinicId,
      name,
      email,
      password,
      phone,
      role
    });

    newUser.password = undefined;

    res.status(201).json({
      success: true,
      data: { user: newUser }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, role } = req.body;
    
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.clinicId },
      { name, phone, role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new AppError('No user found with that ID in this clinic', 404));
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.clinicId },
      { isDeleted: true, deletedAt: new Date(), isActive: false },
      { new: true }
    );

    if (!user) {
      return next(new AppError('No user found with that ID in this clinic', 404));
    }

    res.status(204).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.clinicId },
      { isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new AppError('No user found with that ID in this clinic', 404));
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
