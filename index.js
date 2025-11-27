const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Allowed frontends
const allowedOrigins = [
  'http://localhost:3000',               // Local frontend
  'https://zahra-one.vercel.app'         // Deployed frontend
];

// CORS middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow Postman or curl
    if (allowedOrigins.indexOf(origin) === -1) {
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

    // GET all products
    app.get('/products', async (req, res) => {
      try {
        const products = await productsCollection.find().toArray();
        res.json(products);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
      }
    });

    // GET single product by ID
    app.get('/products/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const product = await productsCollection.findOne({ _id: new ObjectId(id) });
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json(product);
      } catch (err) {
        res.status(500).json({ error: "Invalid product ID" });
      }
    });

    // POST new product
    app.post('/products', async (req, res) => {
      const newProduct = req.body;
      try {
        const result = await productsCollection.insertOne(newProduct);
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: "Failed to create product" });
      }
    });

    // DELETE product
    app.delete('/products/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        res.json({ message: "Product deleted successfully" });
      } catch (err) {
        res.status(500).json({ error: "Invalid product ID" });
      }
    });

    console.log("✅ Connected to MongoDB!");
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
