const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(
     cors({
          origin: [
               "https://restaurant-project-d2dc8.web.app",
               "http://localhost:5173",
               "https://restaurant-project-d2dc8.firebaseapp.com/"
          ],
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
          // await client.connect();
          const foodCollection = client
               .db("restaurantDB")
               .collection("allFoods");

          const purchasedFoodCollection = client
               .db("restaurantDB")
               .collection("purchasedFoods");
          const userCollection = client
               .db("restaurantDB")
               .collection("users");

          // users api

          app.get("/users", async (req, res) => {
               const user = await userCollection.find().toArray();
               res.send(user);
          });

          app.post("/users", async (req, res) => {
               const user = req.body;
               console.log(user);
               const result = await userCollection.insertOne(user);
               res.send(result);
          });





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

          app.put("/allFoods/:id", async (req, res) => {
               const id = req.params.id;
               const updateFoodInfo = req.body;
               const filter = { _id: new ObjectId(id) };
               const options = { upsert: true };
               const updatedItems = {
                    food_name: updateFoodInfo.food_name,
                    food_image: updateFoodInfo.food_image,
                    food_category: updateFoodInfo.food_category,
                    price: updateFoodInfo.price,
                    // added_by: updateFoodInfo.added_by,
                    food_origin: updateFoodInfo.food_origin,
                    description: updateFoodInfo.description,
                    quantity: updateFoodInfo.quantity,
               };
               console.log(updatedItems);
               const result = await foodCollection.updateOne(
                    filter,
                    { $set: { ...updatedItems } },
                    options
               );
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
