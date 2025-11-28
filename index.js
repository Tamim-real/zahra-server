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
const uri = process.env.MONGODB_URI || "mongodb+srv://testDBUser:password@nexdev.mongodb.net/?appName=NexDev";
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
        // Ensure _id is string for frontend
        const formatted = products.map(p => ({ ...p, _id: p._id.toString() }));
        res.json(formatted);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch products' });
      }
    });

    // -------------------------------
    // GET single product by ID
    // -------------------------------
    app.get('/api/products/:id', async (req, res) => {
      let { id } = req.params;
      id = id.trim();

      try {
        let product = null;

        // Try ObjectId first
        if (ObjectId.isValid(id)) {
          product = await productsCollection.findOne({ _id: new ObjectId(id) });
        }

        // Fallback if stored as string
        if (!product) {
          product = await productsCollection.findOne({ _id: id });
        }

        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        // Ensure _id is string for frontend
        product._id = product._id.toString();

        res.json(product);
      } catch (err) {
        console.error("Error fetching product:", err);
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

      try {
        let filter = null;
        if (ObjectId.isValid(id)) {
          filter = { _id: new ObjectId(id) };
        } else {
          filter = { _id: id };
        }

        const result = await productsCollection.updateOne(filter, { $set: updates });

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

      try {
        let filter = null;
        if (ObjectId.isValid(id)) {
          filter = { _id: new ObjectId(id) };
        } else {
          filter = { _id: id };
        }

        const result = await productsCollection.deleteOne(filter);
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
