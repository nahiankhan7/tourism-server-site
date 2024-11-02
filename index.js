const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.j8jy5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Check if environment variables are set
if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error(
    "Database credentials are not set in the environment variables."
  );
  process.exit(1);
}

// Create a MongoClient with the required options
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB and set up API routes
async function run() {
  try {
    await client.connect();
    const dataCollection = client
      .db("tripNestData")
      .collection("tourist_spot_data");

    // Welcome endpoint
    app.get("/", (req, res) => {
      res.send("Welcome to the REST API!");
    });

    // Get all tourist spots
    app.get("/tourist-spot", async (req, res) => {
      try {
        const cursor = dataCollection.find();
        const results = await cursor.toArray();
        res.send(results);
      } catch (error) {
        res.status(500).send({ error: "Error fetching tourist spots" });
      }
    });

    // Get a specific tourist spot by ID
    app.get("/tourist-spot/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await dataCollection.findOne(query);

        if (!result) {
          return res.status(404).send({ message: "Tourist spot not found" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Error fetching tourist spot" });
      }
    });

    // Add a new tourist spot
    app.post("/tourist-spot", async (req, res) => {
      try {
        const newTouristSpot = req.body;
        const result = await dataCollection.insertOne(newTouristSpot);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ error: "Error adding tourist spot" });
      }
    });

    // Update a tourist spot by ID
    app.put("/tourist-spot/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedTouristSpot = req.body;
        const query = { _id: new ObjectId(id) };
        const result = await dataCollection.updateOne(query, {
          $set: updatedTouristSpot,
        });

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "Tourist spot not found or no changes made" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Error updating tourist spot" });
      }
    });

    // Delete a tourist spot by ID
    app.delete("/tourist-spot/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await dataCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Tourist spot not found" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Error deleting tourist spot" });
      }
    });

    // Get tourist spots for a specific user by email
    app.get("/my-list/:email", async (req, res) => {
      try {
        const email = req.params.email;
        console.log("Email parameter:", email);

        if (!email) {
          return res
            .status(400)
            .send({ message: "Email parameter is required" });
        }

        const query = { email: email.trim() }; // Trim whitespace if necessary
        console.log("Query:", query);

        const results = await dataCollection.find(query).toArray(); // Changed to find to get an array
        console.log("My List result:::", results);

        if (results.length === 0) {
          return res
            .status(404)
            .send({ message: "No tourist spots found for this email" });
        }

        res.send(results); // Return the array of results
      } catch (error) {
        console.error("Error fetching user list:", error);
        res.status(500).send({ error: "Error fetching user list" });
      }
    });

    // Confirm successful connection to MongoDB
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // Start the Express server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Run the MongoDB connection and API setup
run().catch(console.dir);
