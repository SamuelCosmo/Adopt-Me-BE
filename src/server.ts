import express from 'express'
import userRoutes from './routes/User.routes'
import tokenRoutes from './routes/Token.routes'
const cors = require('cors')
import db from './db/knexConfig' // Actualiza la importación

const app = express()
const PORT = process.env.PORT || 4200

app.use(cors())
app.use(express.json())
app.use('/user', userRoutes)
app.use('/token', tokenRoutes)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
