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

    const marathonApplication = client
      .db("Marathon")
      .collection("MarathonApplication");

    app.get("/allmarathons", async (req, res) => {
      const cursor = marathonCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/allmarathons/marathons", async (req, res) => {
      const email = req.query.email;
      const query = { creator: email } || {};
      const cursor = marathonCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await marathonCollection.findOne(query);
      res.send(result);
    });

    app.put("/updateCollection/:id", async (req, res) => {
      const id = req.params.id;
      const updateMarathon = req.body;
      const qurey = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updateData = {
        $set: {
          title: updateMarathon.title,
          startRegistrationDate: updateMarathon.startRegistrationDate,
          endRegistrationDate: updateMarathon.endRegistrationDate,
          marathonStartDate: updateMarathon.marathonStartDate,
          location: updateMarathon.location,
          runningDistance: updateMarathon.runningDistance,
          description: updateMarathon.description,
          runningDistance: updateMarathon.runningDistance,
          marathonImage: updateMarathon.marathonImage,
        },
      };
      console.log(updateData);
      const result = await marathonCollection.updateOne(
        qurey,
        updateData,
        option
      );
      res.send(result);
    });
    app.put("/updateApplication/:id", async (req, res) => {
      const id = req.params.id;
      const updateApplication = req.body;
      const qurey = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updateData = {
        $set: {
          firstName: updateApplication.firstName,
          lastName: updateApplication.lastName,
          number: updateApplication.number,
          location: updateApplication.location,
        },
      };
      const result = await marathonApplication.updateOne(
        qurey,
        updateData,
        option
      );
      res.send(result);
    });

    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const qurey = { _id: new ObjectId(id) };
      const result = await marathonApplication.deleteOne(qurey);
      res.send(result);
    });
    app.delete("/delete/marathonCollection/:id", async (req, res) => {
      const id = req.params.id;
      const qurey = { _id: new ObjectId(id) };
      const result = await marathonCollection.deleteOne(qurey);
      res.send(result);
    });

    // find marathon application by user email
    app.get("/marathon/marthonApplication", async (req, res) => {
      const email = req.query.email;
      const qurey = { email: email };
      const cursor = marathonApplication.find(qurey);
      const result = await cursor.toArray();
      res.send(result);
    });

    // add marathon
    app.post("/addmarathons", async (req, res) => {
      const application = req.body;
      const result = await marathonCollection.insertOne(application);
      res.send(result);
    });

    // marathon Applicaiton
    app.post("/marathonApplication", async (req, res) => {
      const application = req.body;
      const result = await marathonApplication.insertOne(application);
      const id = application.marathonId;
      const query = { _id: new ObjectId(id) };
      const marathon = await marathonCollection.findOne(query);
      let newCount = marathon.totalRegistationCount + 1;
      console.log(newCount);
      // now update the marathon collection

      const updateDoc = {
        $set: {
          totalRegistationCount: newCount,
        },
      };
      const updateResult = await marathonCollection.updateOne(query, updateDoc);
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
