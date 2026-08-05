import express from 'express'
import dotenv from 'dotenv'
import fileUpload from 'express-fileupload'
import path from 'path'
import cors from 'cors'
import compression from 'compression'
import fs from 'fs'
import {createServer} from 'http'
import cron from 'node-cron'
import {initializeSocket} from './lib/socket.js'
import {allowedOrigins} from './lib/corsOrigins.js'

import userRouter from './routes/user.route.js'
import adminRouter from './routes/admin.route.js'
import authRouter from './routes/auth.route.js'
import songRouter from './routes/song.route.js'
import albumRouter from './routes/album.route.js'
import statRouter from './routes/stat.route.js'
import artistRouter from './routes/artist.route.js'
import {getSitemap} from './controller/sitemap.controller.js'

dotenv.config()
const __dirname = path.resolve()
const app = express()
const PORT = process.env.PORT || 5000

const httpServer = createServer(app)
initializeSocket(httpServer)

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)
app.use(compression())

app.use(express.json())
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'tmp'),
    createParentPath: true,
    limits: {fileSize: 100 * 1024 * 1024},
    abortOnLimit: true,
    responseOnLimit: 'File is too large. Maximum upload size is 100MB.',
  })
)

// cron jobs
const tempDir = path.join(process.cwd(), 'tmp')
cron.schedule('0 * * * *', () => {
  if (fs.existsSync(tempDir)) {
    fs.readdir(tempDir, (err, files) => {
      if (err) {
        console.log('error', err)
        return
      }
      for (const file of files) {
        fs.unlink(path.join(tempDir, file), (err) => {})
      }
    })
  }
})

app.get('/api/health', (req, res) => {
  res.status(200).json({status: 'ok', timestamp: new Date().toISOString()})
})

app.get('/api/sitemap.xml', getSitemap)

app.use('/api/users', userRouter)
app.use('/api/admin', adminRouter)
app.use('/api/auth', authRouter)
app.use('/api/songs', songRouter)
app.use('/api/albums', albumRouter)
app.use('/api/stats', statRouter)
app.use('/api/artists', artistRouter)

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

httpServer.listen(PORT, () => {
  console.log('Server is running on port ' + PORT)
})
