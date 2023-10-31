const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


//Middleware 
app.use(cors())
app.use(express.json())


//Database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cgjyfgp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const servicesCollection = client.db('geniusCarDoctorDB').collection('services')

        const bookingsCollection = client.db('geniusCarDoctorDB').collection('bookings')

        //Services related APIs
        //POST
        app.post('/services', async (req, res) => {
            const newService = req.body
            const result = await servicesCollection.insertOne(newService)
            res.send(result)
        })

        //GET
        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        //GET single service
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { title: 1, img: 1, service_id: 1, price: 1 },
            };
            const result = await servicesCollection.findOne(query, options)
            res.send(result)
        })

        //Bookings related APIs
        //POST
        app.post('/bookings', async (req, res) => {
            const newBooking = req.body
            const result = await bookingsCollection.insertOne(newBooking)
            res.send(result)
        })

        // GET
        app.get('/bookings', async (req, res) => {
            let query = {}
            if (req.query?.email) {
                query = { email: req.query?.email }
            }
            const cursor = bookingsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        //Update
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const updatedBooking = req.body
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            const result = await bookingsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        //DELETE
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bookingsCollection.deleteOne(query)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("The Genius car doctor server is running...")
})

app.listen(port, () => {
    console.log(`The server is running on port: ${port}`);
})