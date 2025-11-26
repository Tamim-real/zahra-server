const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://testDBUser:ilc1EMeIFZrlY5n9@nexdev.5cutabm.mongodb.net/?appName=NexDev";
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

async function run() {
  try {
    await client.connect();
    const db = client.db('testDBUser');
    const productsCollection = db.collection('products');

    
    app.get('/products', async (req, res) => {
      const products = await productsCollection.find().toArray();
      res.json(products);
    });

   
    app.get('/products/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const product = await productsCollection.findOne({ _id: new ObjectId(id) });
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.json(product);
      } catch (error) {
        res.status(500).json({ error: "Invalid product ID" });
      }
    });

    
    app.post('/products', async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.json(result);
    });

  
    app.delete('/products/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        res.json({ message: "Product deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: "Invalid product ID" });
      }
    });

    console.log("✅ Connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
