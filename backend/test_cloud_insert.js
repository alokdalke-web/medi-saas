require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('./src/modules/patients/patient.model');
const User = require('./src/modules/users/user.model');

async function testCloudInsert() {
  console.log('Connecting to MongoDB...');
  // Default connection string if env var is missing
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medi-saas';
  await mongoose.connect(mongoUri);
  
  const user = await User.findOne({ email: 'admin@clinic.com' });
  if (!user) {
    console.error('Admin user not found in MongoDB!');
    process.exit(1);
  }

  console.log('Creating a patient directly in the Cloud MongoDB Database...');
  const newPatient = await Patient.create({
    clinicId: user.clinicId,
    patientId: `PAT-CLOUD-${Math.floor(Math.random() * 1000)}`,
    firstName: 'CloudSync',
    lastName: 'Test',
    phone: '5551234567',
    dateOfBirth: new Date('1995-05-05'),
    gender: 'Male',
    bloodGroup: 'O+',
    createdBy: user._id
  });

  console.log('✅ Success! Patient inserted into MongoDB:');
  console.log(`Name: ${newPatient.firstName} ${newPatient.lastName}`);
  console.log(`Patient ID: ${newPatient.patientId}`);
  
  console.log('\n======================================================');
  console.log('           HOW TO TEST THE DOWNSTREAM SYNC            ');
  console.log('======================================================');
  console.log('1. Open your Desktop App (make sure you are logged in).');
  console.log('2. Disconnect your computer from Wi-Fi (this triggers the "offline" state).');
  console.log('3. Reconnect to Wi-Fi.');
  console.log('4. Watch the yellow banner appear on the Desktop App as it synchronizes.');
  console.log('5. Check the Patients tab—the new "CloudSync Test" patient will be there!');
  
  process.exit(0);
}

testCloudInsert();
