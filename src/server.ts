import dotenv from 'dotenv'

// Load environment variables FIRST, before any other imports
dotenv.config()

import express from 'express'
import userRoutes from './routes/User.routes'
import tokenRoutes from './routes/Token.routes'
import speciesRoutes from './routes/Species.routes'
import breedRoutes from './routes/Breed.routes'
import adoptionRoutes from './routes/Adoption.routes'
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 4200

app.use(cors())
app.use(express.json())
app.use('/user', userRoutes)
app.use('/token', tokenRoutes)
app.use('/species', speciesRoutes)
app.use('/breed', breedRoutes)
app.use('/adoption', adoptionRoutes)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
