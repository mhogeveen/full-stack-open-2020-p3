require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const Person = require('./models/person')

const app = express()

morgan.token('content', (request, response) => {
   return JSON.stringify(request.body)
})

app.use(
   express.static('build'),
   express.json(),
   morgan(':method :url :status :res[content-length] - :response-time ms :content'),
   cors()
)

app.get('/info', (request, response) => {
   Person.countDocuments({}, (err, count) => {
      response.send(`<p>Phonebook has info for ${count} people.<br><br>${Date()}</p>`)
   })
})

app.get('/api', (request, response) => {
   response.send(
      "<p>To access the api use the following url's:<br><ul><li>/api/persons --> every person in the phonebook</li><li>/api/persons/unique_id --> unique person in the phonebook</li></ul></p>"
   )
})

app.get('/api/persons', (request, response, next) => {
   Person.find({}) //force break
      .then((persons) => {
         response.json(persons.map((person) => person.toJSON()))
      })
      .catch((error) => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
   Person.findById(request.params.id) //force break
      .then((person) => {
         if (person) {
            response.json(person.toJSON())
         } else {
            response.status(404).end()
         }
      })
      .catch((error) => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
   Person.findByIdAndRemove(request.params.id) //force break
      .then((result) => {
         response.status(204).end()
      })
      .catch((error) => next(error))
})

app.post('/api/persons', (request, response, next) => {
   const body = request.body

   if (body.name === undefined || body.number === undefined) {
      return response.status(400).json({
         error: 'content missing',
      })
   }

   const person = new Person({
      name: body.name,
      number: body.number,
   })

   person //force break
      .save()
      .then((savedPerson) => {
         response.json(savedPerson.toJSON())
      })
      .catch((error) => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
   const body = request.body

   const person = {
      number: body.number,
   }

   Person.findByIdAndUpdate(request.params.id, person, { new: true })
      .then((updatedPerson) => {
         response.json(updatedPerson.toJSON())
      })
      .catch((error) => next(error))
})

const errorHandler = (error, request, response, next) => {
   console.error(error.message)

   if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return response.status(400).send({ error: 'malformatted id' })
   } else if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
   }
   next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`)
})
