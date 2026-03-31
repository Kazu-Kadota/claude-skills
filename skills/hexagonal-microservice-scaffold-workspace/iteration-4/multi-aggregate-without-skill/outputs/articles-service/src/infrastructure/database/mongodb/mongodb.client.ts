import mongoose from 'mongoose'

export class MongoDBClient {
  private static instance: MongoDBClient
  private uri: string

  private constructor(uri: string) {
    this.uri = uri
  }

  static getInstance(uri?: string): MongoDBClient {
    if (!MongoDBClient.instance) {
      if (!uri) {
        throw new Error('MongoDBClient requires URI on first instantiation')
      }
      MongoDBClient.instance = new MongoDBClient(uri)
    }
    return MongoDBClient.instance
  }

  async connect(): Promise<void> {
    await mongoose.connect(this.uri)
    console.log('MongoDB connected successfully')
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect()
    console.log('MongoDB disconnected')
  }

  getConnection(): typeof mongoose {
    return mongoose
  }
}
