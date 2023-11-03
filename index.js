const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000


//Middleware 
app.use(cors({
    // origin: ['http://localhost:5173'],
    origin: ['https://genius-car-doctor-react.web.app', 'https://genius-car-doctor-react.firebaseapp.com', 'http://localhost:5173'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())


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

// Custom Middleware 
const logger = async (req, res, next) => {
    console.log("Called:", req.host, req.originalUrl);
    next()
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies.token
    console.log("The desired token:", token);

    if (!token) {
        return res.status(401).send({ message: "Unauthorized" })
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Unauthorized" })
        }
        console.log("The value of token:", decoded);
        req.body = decoded
        next()
    })

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const servicesCollection = client.db('geniusCarDoctorDB').collection('services')

        const bookingsCollection = client.db('geniusCarDoctorDB').collection('bookings')

        //JWT related APIs
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

            }).send({ success: true })
        })

        //Remove token after logout the user
        // app.post('/logout', async (req, res) => {
        //     const user = req.body
        //     console.log("User: ", user);
        //     res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        // })
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie(
                "token",
                {
                    maxAge: 0,
                    secure: process.env.NODE_ENV === "production" ? true : false,
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                }
            ).send({ success: true })
        })

        // Remove token by JWT
        app.post('/logout', (req, res) => {
            const user = req.body
            console.log("Logging out", user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        //Services related APIs
        //POST
        app.post('/services', async (req, res) => {
            const newService = req.body
            const result = await servicesCollection.insertOne(newService)
            res.send(result)
        })

        //GET
        app.get('/services', logger, async (req, res) => {
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
        app.get('/bookings', logger, verifyToken, async (req, res) => {
            console.log("My token:", req.cookies.token);

            if (req.query?.email !== req.query?.email) {
                return res.status(403).send({ message: 'Forbidden access' })
            }

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