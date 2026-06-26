const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./core/middlewares/error.middleware');
const AppError = require('./core/utils/appError');

// Routes
const authRouter = require('./modules/auth/auth.routes');
const clinicRouter = require('./modules/clinics/clinic.routes');
const userRouter = require('./modules/users/user.routes');
const doctorRouter = require('./modules/doctors/doctor.routes');
const patientRouter = require('./modules/patients/patient.routes');
const appointmentRouter = require('./modules/appointments/appointment.routes');
const dashboardRouter = require('./modules/dashboard/dashboard.routes');
const syncRouter = require('./modules/sync/sync.routes');
const medicalRecordRouter = require('./modules/medical-records/medical-record.routes');
const swaggerDocs = require('./config/swagger');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/clinics', clinicRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/doctors', doctorRouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/appointments', appointmentRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/medical-records', medicalRecordRouter);

// Initialize Swagger Docs
swaggerDocs(app);

// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
