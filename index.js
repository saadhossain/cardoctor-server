const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
app.use(cors())
app.use(express.json())

//Default Port on Server
app.get('/', (req, res) => {
    res.send('Car Doctor Server is Running...')
})
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@firstmongodb.yjij5fj.mongodb.net/?retryWrites=true&w=majority`;
const uri = "mongodb://localhost:27017"

const client = new MongoClient(uri);
//JWT Tokens and Verifications

 //Genarate a Access token for the user to access restricted data
 app.post('/getaccesstoken', async(req, res)=> {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'})
    res.send({token})
})
//Get the AccessToken from the Client site
const verifyJWT = (req, res, next) => {
    const getHeader = req.headers.authorization;
    if(!getHeader){
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = getHeader.split(' ')[1]
    // console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded){
        if(err){
            return res.status(401).send({message: 'You are not Authorized'})
        }
        req.decoded = decoded;
        next() 
    })
}


const dbConnect = () => {
    const servicesData = client.db('carDoctor').collection('services');

    //Get Services Data from the MongoDB
    app.get('/services', async(req, res)=> {
        const query = {};
        const cursor = servicesData.find(query)
        const services = await cursor.toArray()
        res.send(services)
    })
    //Get Single Service from MongoDB
    app.get('/services/:id', async(req, res)=> {
        const id = req.params.id;
        const query = {_id: ObjectId(id)}
        const result = await servicesData.findOne(query)
        res.send(result)
    })
    //Order Details
    const orderData = client.db('carDoctor').collection('orders')
    //Set Order data to mongodb
    app.post('/orders', async(req, res)=> {
        const order = req.body;
        const result = await orderData.insertOne(order)
        res.send(result)
        console.log(result);
    })
    //Get data based on query
    app.get('/orders', verifyJWT, async(req, res)=>{
        try{
            const decoded = req.decoded;
        const email = req.query.email;
        if(decoded?.email !== email){
            res.status(401).send({message: 'Data Forbidden for you'})
        }

        let query = {}
        if(email){
            query = {
                email: email
            }
        }
        const cursor = orderData.find(query)
        const order = await cursor.toArray()
        res.send(order)
        }
        catch(err){
            console.log(err);
        }
    })
    //Delete a Specific Data from MongoDB
    app.delete('/orders/:id', async(req, res)=> {
        const id = req.params.id;
        const query = {_id: ObjectId(id)}
        const result = await orderData.deleteOne(query)
        res.send(result);
        console.log(result);
    })
    //Update A Specific data based on Id
    app.patch('/orders/:id', async(req, res)=> {
        const id = req.params.id;
        const status = req.body.status;
        console.log(status);
        const query = {_id: ObjectId(id)}
        const updatedOrder = {
            $set: {
                status: status
            }
        }
        const result = await orderData.updateOne(query, updatedOrder);
        res.send(result)
    })
}
dbConnect()
//Server listener
app.listen(port, ()=> {
    console.log('Server Running on Port:', port);
})