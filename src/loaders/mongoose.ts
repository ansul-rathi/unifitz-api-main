/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable one-var */
import mongoose from 'mongoose';
import { mongoDbUri ,mongoDbName} from '@config/constants';

mongoose.connect(mongoDbUri as string, { maxPoolSize: 25, dbName: mongoDbName });

// Add connection success handler
mongoose.connection.once('connected', () => {
  console.log(`Connected to MongoDB`);
});

mongoose.connection.on('error', (err) => {
  console.log(err);
  throw new Error(`unable to connect to database: ${mongoDbUri}`);
});

mongoose.set('strictQuery', true);

process.on('SIGINT', function () {
  mongoose.connection.close();
});

process.on('SIGTERM', function () {
  mongoose.connection.close();
});
