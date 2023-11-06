const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(
     cors({
          origin: ["http://localhost:5173"],
          credentials: true,
     })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pz6rkt0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     },
});

async function run() {
     try {
          // Connect the client to the server	(optional starting in v4.7)
          await client.connect();
          const foodCollection = client
               .db("restaurantDB")
               .collection("allFoods");

          const purchasedFoodCollection = client
               .db("restaurantDB")
               .collection("purchasedFoods");
          // allFoods api
          app.get("/allFoodsCount", async (req, res) => {
               const count = await foodCollection.estimatedDocumentCount();
               res.send({ count });
          });
          app.get("/allFoods", async (req, res) => {
               const page = parseInt(req.query.page);
               const size = parseInt(req.query.size);
               // console.log(page, size);
               const result = await foodCollection
                    .find()
                    .skip(page * size)
                    .limit(size)
                    .toArray();
               res.send(result);
          });
          app.get("/allFoods/:id", async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) };
               const result = await foodCollection.findOne(query);
               res.send(result);
          });
          app.post("/allFoods", async (req, res) => {
               const addedItems = req.body;
               console.log(addedItems);
               const result = await foodCollection.insertOne(addedItems);
               res.send(result);
          });

          // purchased food
          app.get("/purchasedFoods", async (req, res) => {
               let query = {};
               if (req.query?.email) {
                    query = { email: req.query.email };
               }
               const result = await purchasedFoodCollection
                    .find(query)
                    .toArray();

               res.send(result);
          });
          app.post("/purchasedFoods", async (req, res) => {
               const allData = req.body;
               console.log(allData);
               const result = await purchasedFoodCollection.insertOne(allData);
               res.send(result);
          });
          
          app.delete("/purchasedFoods/:id", async (req, res) => {
               const id = req.params.id;
               const query = { _id: new ObjectId(id) };
               const result = await purchasedFoodCollection.deleteOne(query);
               res.send(result);
          });

          // Send a ping to confirm a successful connection
          await client.db("admin").command({ ping: 1 });
          console.log(
               "Pinged your deployment. You successfully connected to MongoDB!"
          );
     } finally {
          // Ensures that the client will close when you finish/error
          //     await client.close();
     }
}
run().catch(console.dir);

app.get("/", (req, res) => {
     res.send("restaurant server is running");
});

app.listen(port, () => {
     console.log(`restaurant server is running on port ${port}`);
});
