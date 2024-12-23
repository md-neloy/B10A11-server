const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

// middlewire
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.Db_Name}:${process.env.Db_Pass}@cluster0.fgiq9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
app.get("/", (req, res) => {
  res.send("Marathon is On going");
});

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    const marathonCollection = client
      .db("Marathon")
      .collection("MarathonCollection");

    app.get("/allmarathons", async (req, res) => {
      const cursor = marathonCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/allmarathons/marathons", async (req, res) => {
      const cursor = marathonCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await marathonCollection.findOne(query);
      res.send(result);
    });

    // add marathon
    app.post("/addmarathons", async (req, res) => {
      const application = req.body;
      console.log(application);
      const result = await marathonCollection.insertOne(application);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(process.env.Db_Name);
  console.log(`marathon is runnnig on port: ${port}`);
});
