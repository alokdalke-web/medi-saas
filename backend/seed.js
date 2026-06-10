require('dotenv').config();
const mongoose = require('mongoose');
const Clinic = require('./src/modules/clinics/clinic.model');
const User = require('./src/modules/users/user.model');
const connectDB = require('./src/config/db');

const seedUser = async () => {
  await connectDB();

  try {
    // Clear old data
    await mongoose.model('Clinic').deleteMany({});
    await User.deleteMany({});

    // Create a new Clinic first
    const clinic = await mongoose.model('Clinic').create({
      name: 'City Care Clinic',
      email: 'contact@citycare.com',
      phone: '9876543210',
      address: {
        city: 'New York',
        country: 'USA'
      }
    });

    // Create a new user linked to clinic
    const user = await User.create({
      clinicId: clinic._id,
      name: 'Admin User',
      email: 'admin@clinic.com',
      password: 'password123',
      role: 'clinic_admin',
    });

    console.log('Successfully created test user!');
    console.log('Email: admin@clinic.com');
    console.log('Password: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
};

seedUser();
