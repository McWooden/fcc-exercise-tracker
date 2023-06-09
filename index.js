const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

const UserSchema = new mongoose.Schema({
  username: String,
})
const User = mongoose.model("User", UserSchema)

const ExerciseSchema = new mongoose.Schema({
  user_id: String,
  description: String,
  duration: Number,
  date: Date,
})
const Exercise = mongoose.model("Exercise", ExerciseSchema)

// user endpoint
app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select("_id username")
  if (!users) return res.json({message: 'User not found'})
  res.json(users)
})
app.post("/api/users", async (req, res) => {
  try {
    const userObj = new User({
      username: req.body.username
    })
    const user = await userObj.save()
    res.json(user)
  } catch(err) {
  }
})

// exercise endpoint
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body
    const user = await User.findById(req.params._id)
    if (!user) return res.json({msg: 'user not found'})
    const exercise = await Exercise.create({user_id: user._id, description, duration, date: date ? new Date(date) : new Date()}) // Shortcut for saving one or more documents
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    })
  } catch(err) {
    res.send({msg: 'error save()'})
  }
})

// let filter = {
//   user_id: 123,
//   date: {
//     $gte: 1682330752157,
//     $lte: 1682330892155
//   }
// }
// great, less than equal to
// toIsoString()
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query
  const userId = req.params._id
  try {
    const user = await User.findById(userId)
    if (!user) throw new Error("Could not find user")
    const filter = { user_id: userId }
    if (from) filter.date = { $gte: new Date(from) }
    if (to) filter.date = { ...filter.date, $lte: new Date(to) }
    const exercises = await Exercise.find(filter).limit(+limit)
    const logs = exercises.map(({ description, duration, date }) => ({
      description,
      duration,
      date: date.toDateString()
    }))
    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: logs
    })
  } catch (err) {
    res.json({ error: err.message })
  }
})


app.get('/api/deleteAll/users', async (req, res) => {
  try {
    let user = await User.deleteMany({})
    let exer = await Exercise.deleteMany({})
    res.json({message: 'Success', users: user.deletedCount, exercise: exer.deletedCount})
  } catch (err) {
    res.json({error: err})
  }
})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  let listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
  })
}).catch(err => {
  console.error(err)
})
