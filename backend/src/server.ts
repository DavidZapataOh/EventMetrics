import express, { Express, Request, Response, NextFunction } from "express";
const app: Express = express();
import mongoose from 'mongoose'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db'
import path from 'path'
import configureSecurityMiddleware from './middleware/securityMiddleware'
import authRoutes from './routes/api/auth'
import eventRoutes from './routes/api/events'
import userRoutes from './routes/api/users'
import analyticsRoutes from './routes/api/analytics'
import web3Routes from './routes/api/web3'
import walletsRoutes from './routes/api/wallets'

configureSecurityMiddleware(app)

const whitelistDev = [process.env.FRONTEND_URL_DEV || 'http://localhost:3001'];
const whitelistProd = [process.env.FRONTEND_URL_PROD || 'https://www.example.com'];

app.use(cors({
    origin: (origin, callback) => {
        let whitelist
        if (process.env.NODE_ENV === 'development') {
            whitelist = whitelistDev
        } else {
            whitelist = whitelistProd
        }
        if (!origin || whitelist.includes(origin)) {
            callback(null, true)
        } else {
            console.log('Origin blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const initializeServer = async () => {
    try {
        await connectDB()
        app.use('/api/auth', authRoutes)
        app.use('/api/events', eventRoutes)
        app.use('/api/users', userRoutes)
        app.use('/api/analytics', analyticsRoutes)
        app.use('/api/web3', web3Routes)
        app.use('/api/wallets', walletsRoutes)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

initializeServer()

export default app
