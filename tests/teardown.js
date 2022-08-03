const mongoose = require('mongoose');
// teardown function for
// mongoose db connection
module.exports = async () => {
  // await mongoose.connection.close();
  process.exit(0);
};
