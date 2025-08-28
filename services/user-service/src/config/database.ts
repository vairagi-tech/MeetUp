import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URL;
    
    if (!mongoURI) {
      throw new Error('MongoDB connection string is required. Please set MONGODB_URI or MONGODB_URL environment variable.');
    }

    const options = {
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      family: 4, // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('📦 MongoDB connection closed through app termination');
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
      }
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    
    // Exit process with failure
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
};

// Export mongoose for use in other files if needed
export { mongoose };
