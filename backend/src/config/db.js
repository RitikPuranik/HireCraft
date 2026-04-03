import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true)
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,  // fail fast if DB unreachable
    })
    console.log(`MongoDB Connected: ${conn.connection.host}`)

    // Graceful disconnect on termination signals
    const closeDB = async (signal) => {
      await mongoose.connection.close()
      console.log(`MongoDB disconnected on ${signal}`)
      process.exit(0)
    }
    process.on('SIGINT',  () => closeDB('SIGINT'))
    process.on('SIGTERM', () => closeDB('SIGTERM'))
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
