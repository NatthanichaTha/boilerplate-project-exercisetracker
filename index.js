const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const uri = "mongodb+srv://natthanicha:mondodb@cluster0.23hr1jt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const { Schema } = mongoose;
const bodyParser = require('body-parser');

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new Schema({
  username: String,
  count: {type: Number, default: 0},
  log: [{
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: {type: Date}
  }]
});

const Users = mongoose.model('Users', userSchema);

async function runMongoDB() {
  await mongoose.connect(uri, clientOptions);
  await mongoose.connection.db.admin().command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");

}

runMongoDB().catch(console.dir);

app.post('/api/users', async function (req, res) {
  const { username } = req.body;
  console.log(username);
  let newUser = new Users({
    username
  });

  newUser.save()
  .then(res.json({
    username: newUser.username,
    _id: newUser._id
  }))
})

app.get('/api/users', async function(req, res){
  result = Users.find().select({username: 1, _id: 1}).then(data => res.json(data));
})

app.post('/api/users/:_id/exercises', async function(req, res){
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const user = await Users.findById(_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  } else {

    if (!user.log) {
      user.log = [];
    }

    exercise = {
      description,
      duration: Number(duration),
      date: date ? new Date(date).toDateString() : new Date().toDateString()
    }

    user.log.push(exercise);
    console.log(exercise);
    
    user.count += 1;
    user.save().then(() => res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date,
      duration: exercise.duration,
      description: exercise.description
    }));
  }

})

app.get('/api/users/:_id/logs', async function(req, res){
  const { _id } = req.params;
  const user = await Users.findById(_id).select({ username: 1, count: 1, _id: 1, log: 1 });
    
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const {from, to, limit} = req.query;
  let logs = user.log;
  if (from){
    const fromDate = new Date(from);
    logs = logs.filter(log => new Date(log.date) >= fromDate);
  }
  if (to){
    const toDate = new Date(to);
    logs = logs.filter(log => new Date(log.date) <= toDate);
  }
  if (limit){
  logs = logs.slice(0, parseInt(limit));
  }

  logs = logs.map(log => {
    return {
      ...log.toObject(),
      date: new Date(log.date).toDateString()
    };
  });

  res.json({
    username: user.username,
    _id: user._id,
    count: logs.length,
    log: logs
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
