const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

// middlewire
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://marathon-guide.web.app",
      "https://marathon-guide.firebaseapp.com",
    ],
    credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.Db_Name}:${process.env.Db_Pass}@cluster0.fgiq9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
app.get("/", (req, res) => {
  res.send("Marathon is On going");
});

// verify the jwt token
const verifyToken = (req, res, next) => {
  const token = req.cookies?.jwToken;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  // verify the token
  jwt.verify(token, process.env.jwt_Secrate_key, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const marathonCollection = client
      .db("Marathon")
      .collection("MarathonCollection");

    const marathonApplication = client
      .db("Marathon")
      .collection("MarathonApplication");

    // Auth Related APIs
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.jwt_Secrate_key, {
        expiresIn: "24hr",
      });
      res
        .cookie("jwToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ [`success token`]: true });
    });

    // jwt remove
    app.post("/jwtLogout", async (req, res) => {
      res
        .clearCookie("jwToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({
          ["successfully Logout:"]: true,
        });
    });

    app.get("/marathonsLimit", async (req, res) => {
      const cursor = marathonCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/allmarathons", async (req, res) => {
      const sortOrder = req.query.sortOrder || "desc";
      const sortQuery =
        sortOrder === "asc" ? { createdAt: 1 } : { createdAt: -1 };

      const cursor = marathonCollection.find().sort(sortQuery);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/allmarathons/marathons", verifyToken, async (req, res) => {
      const email = req.query.email;
      if (email) {
        if (req.user?.email !== email) {
          res.status(403).send({ message: "forbidden accesss" });
        }
      }
      const query = email ? { creator: email } : {};

      const cursor = marathonCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/details/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await marathonCollection.findOne(query);
      res.send(result);
    });

    app.put("/updateCollection/:id", async (req, res) => {
      const id = req.params.id;
      const updateMarathon = req.body;
      const query = { _id: new ObjectId(id) };
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
      const query2 = { marathonId: id };
      const update2 = {
        $set: {
          title: updateMarathon.title,
        },
      };
      const result2 = await marathonApplication.updateMany(query2, update2);
      const result = await marathonCollection.updateOne(
        query,
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
    app.get("/marathon/marthonApplication", verifyToken, async (req, res) => {
      const { email, title } = req.query;
      const qurey = { email: email };
      if (req.user?.email !== email) {
        res.status(403).send({ message: "forbidden accesss" });
      }
      if (title) {
        qurey.title = { $regex: title, $options: "i" };
      }

      const cursor = marathonApplication.find(qurey);
      const result = await cursor.toArray();
      console.log(result);

      res.send(result);
    });

    // add marathon
    app.post("/addmarathons", verifyToken, async (req, res) => {
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
