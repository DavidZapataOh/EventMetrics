module.exports = {
    corsOptions: {
        origin: process.env.FRONTEND_URL || '',
        credentials: true,
    },
    mongooseOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
    },   
}
