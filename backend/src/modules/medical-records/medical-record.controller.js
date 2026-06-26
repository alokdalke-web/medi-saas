const MedicalRecord = require('./medical-record.model');
const AppError = require('../../core/utils/appError');
const catchAsync = require('../../core/utils/catchAsync');

exports.getAllRecords = catchAsync(async (req, res, next) => {
  const filter = { isDeleted: false };
  if (req.query.patientId) {
    filter.patientId = req.query.patientId;
  }
  
  const records = await MedicalRecord.find(filter)
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'name specialization')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: records.length,
    data: { records }
  });
});

exports.createRecord = catchAsync(async (req, res, next) => {
  const record = await MedicalRecord.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { record }
  });
});

exports.getRecord = catchAsync(async (req, res, next) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate('patientId', 'firstName lastName')
    .populate('doctorId', 'name specialization');

  if (!record) {
    return next(new AppError('No record found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { record }
  });
});

exports.updateRecord = catchAsync(async (req, res, next) => {
  const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!record) {
    return next(new AppError('No record found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { record }
  });
});

exports.deleteRecord = catchAsync(async (req, res, next) => {
  const record = await MedicalRecord.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });

  if (!record) {
    return next(new AppError('No record found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
