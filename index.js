const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

/* ========================================
   Middleware
======================================== */

const allowedOrigins = [
  "http://localhost:3000",
  "https://zahra-one.vercel.app",
  "https://zahra-server-ten.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS Error: ${origin} is not allowed.`));
    },
    credentials: true,
  })
);

app.use(express.json());

/* ========================================
   MongoDB
======================================== */

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://testDBUser:ilc1EMeIFZrlY5n9@nexdev.5cutabm.mongodb.net/testDBUser?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let productsCollection;

/* ========================================
   Helpers
======================================== */

const getProductFilter = (id) => {
  return ObjectId.isValid(id)
    ? { _id: new ObjectId(id) }
    : { _id: id };
};

/* ========================================
   Database Connection
======================================== */

async function connectDB() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("✅ MongoDB Connected Successfully");

    const db = client.db("testDBUser");

    productsCollection = db.collection("products");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error);

    process.exit(1);
  }
}

/* ========================================
   Routes
======================================== */

app.get("/", (req, res) => {
  res.send("🚀 Zahra API Running");
});

/* ========================================
   Products Routes
======================================== */

// GET ALL PRODUCTS

app.get("/api/products", async (req, res) => {
  try {
    const products = await productsCollection.find().toArray();

    const formattedProducts = products.map((product) => ({
      ...product,
      _id: product._id.toString(),
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

// GET SINGLE PRODUCT

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productsCollection.findOne(
      getProductFilter(id.trim())
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product._id = product._id.toString();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

// CREATE PRODUCT

app.post("/api/products", async (req, res) => {
  try {
    const product = req.body;

    const result = await productsCollection.insertOne(product);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
});

// UPDATE PRODUCT

app.patch("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updates = req.body;

    const result = await productsCollection.updateOne(
      getProductFilter(id),
      {
        $set: updates,
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
});

// DELETE PRODUCT

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await productsCollection.deleteOne(getProductFilter(id));

    if (!result.deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
});

/* ========================================
   404 Handler
======================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

/* ========================================
   Global Error Handler
======================================== */

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* ========================================
   Start Server
======================================== */

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();