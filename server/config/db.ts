import mongoose from 'mongoose';
import { dbStore } from '../storage/store.js';

let isMongoConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to MongoDB Atlas at configured URI...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isMongoConnected = true;
      console.log('Successfully connected to MongoDB Atlas!');
      return true;
    } catch (err) {
      console.warn('MongoDB connection failed, falling back to local persistent JSON engine:', err);
      isMongoConnected = false;
      return false;
    }
  } else {
    console.log('No MONGODB_URI configured. Running with persistent local database engine.');
    isMongoConnected = false;
    return false;
  }
}

export function isConnected(): boolean {
  return isMongoConnected;
}
