const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
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
               "https://restaurant-project-d2dc8.firebaseapp.com",
               "http://localhost:5000",
          ],
          credentials: true,
     })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pz6rkt0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     },
});

// my created middleware
const verifyToken = async (req, res, next) => {
     const token = req.cookies?.token;
     console.log("verified token", token);
     if (!token) {
          return res.status(401).send({ message: "unauthorized" });
     }
     jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
          if (err) {
               return res.status(401).send({ message: "unauthorized" });
          }
          console.log("value in the token", decoded);
          req.user = decoded;
          next();
     });
};

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
          const userCollection = client.db("restaurantDB").collection("users");

          // jwt authorization
          app.post("/jwt", async (req, res) => {
               const user = req.body;
               console.log("logged user", user);
               const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                    expiresIn: "1hr",
               });
               res.cookie("token", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
               }).send({ message: "success" });
          });
          app.post("/logout", async (req, res) => {
               const user = req.body;
               console.log("logout user", user);
               res.clearCookie("token", {
                    maxAge: 0,
                    sameSite: "none",
                    secure: true,
               }).send({ success: true });
               // res.clearCookie("token", { maxAge: 0 }).send({ success: true });
          });

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
          // app.get("/allFoods", async (req, res) => {
          //      const page = parseInt(req.query.page);
          //      const size = parseInt(req.query.size);
          //      // console.log(page, size);
          //      const result = await foodCollection
          //           .find()
          //           .skip(page * size)
          //           .limit(size)
          //           .toArray();
          //      res.send(result);
          // });
          app.get("/allFoods", async (req, res) => {
               const page = parseInt(req.query.page);
               const size = parseInt(req.query.size);
               // console.log(page, size);
               const filter = req.query;
               // console.log(filter);
               const query = {
                    food_name: { $regex: new RegExp(filter.search, "i") },
               };
               const result = await foodCollection
                    .find(query)
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
          app.patch("/allFoods/:id", async (req, res) => {
               const id = req.params.id;
               const filter = { _id: new ObjectId(id) };
               const updatedOrder = req.body;
               const updateFood = {
                    $set: {
                         ordered: updatedOrder.afterOrder,
                         quantity: updatedOrder.afterQuantity,
                    },
               };
               const result = await foodCollection.updateOne(
                    filter,
                    updateFood
               );
               res.send(result);
          });

          // purchased food
          app.get("/purchasedFoods", verifyToken, async (req, res) => {
               console.log("email", req.query?.email);
               console.log("cookiesss", req.cookies);
               console.log(req.user);
               // console.log("user from valid token", req.user);
               // console.log("token", req.cookies?.token);
               if (req.query?.email !== req.user.email) {
                    return res
                         .status(403)
                         .send({ message: "forbidden access" });
               }
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
