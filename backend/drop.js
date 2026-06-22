const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/clinicflow').then(async () => {
  console.log('Connected to DB. Dropping database...');
  await mongoose.connection.db.dropDatabase();
  console.log('Database dropped.');
  process.exit(0);
});
