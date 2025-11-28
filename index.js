const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Allowed frontends
const allowedOrigins = [
  'http://localhost:3000',
  'https://zahra-one.vercel.app',
  'https://zahra-server-ten.vercel.app'
];

// CORS middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow Postman/curl
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error(`CORS error: origin ${origin} not allowed`), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// MongoDB connection
const uri = "mongodb+srv://testDBUser:ilc1EMeIFZrlY5n9@nexdev.5cutabm.mongodb.net/?appName=NexDev";
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

async function run() {
  try {
    await client.connect();
    const db = client.db('testDBUser');
    const productsCollection = db.collection('products');

    console.log("✅ Connected to MongoDB!");

    // -------------------------------
    // GET all products
    // -------------------------------
    app.get('/api/products', async (req, res) => {
      try {
        const products = await productsCollection.find().toArray();
        res.json(products);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch products' });
      }
    });

    // -------------------------------
    // GET single product by ID
    // -------------------------------
    app.get('/api/products/:id', async (req, res) => {
      const { id } = req.params;
      const cleanId = id.trim().replace(/\/$/, "");

      if (!ObjectId.isValid(cleanId)) {
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      try {
        let product = await productsCollection.findOne({ _id: new ObjectId(cleanId) });

        // fallback if _id was saved as string
        if (!product) {
          product = await productsCollection.findOne({ _id: cleanId });
        }

        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // -------------------------------
    // POST new product
    // -------------------------------
    app.post('/api/products', async (req, res) => {
      const newProduct = req.body;
      try {
        const result = await productsCollection.insertOne(newProduct);
        res.status(201).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create product" });
      }
    });

    // -------------------------------
    // PATCH update product
    // -------------------------------
    app.patch('/api/products/:id', async (req, res) => {
      const { id } = req.params;
      const updates = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      try {
        const result = await productsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updates }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product updated successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update product" });
      }
    });

    // -------------------------------
    // DELETE product
    // -------------------------------
    app.delete('/api/products/:id', async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID format" });
      }

      try {
        const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Product not found" });
        }
        res.json({ message: "Product deleted successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}

run().catch(console.dir);

// Default route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
