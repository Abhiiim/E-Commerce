const express = require("express");
const mongoose = require("mongoose");
const User = require("./db/User");
const Product = require("./db/Product");
const cors = require("cors");
require("./db/config");
const Jwt = require("jsonwebtoken");
const jwtKey = "e-commerce";

const app = express();
app.use(express.json())
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));

app.post("/register", async (req, res) => {
    let user = new User(req.body);
    user = await user.save();
    user = user.toObject();
    delete user.password;
    Jwt.sign({ user }, jwtKey, (err, token) => {
        if (err) {
            res.send("Something went wrong! Try again later");
        } else {
            res.send({ user, auth: token });
        }
    })
})

app.post("/login", async (req, res) => {
    const user = await User.findOne(req.body).select("-password");
    if (user) {
        Jwt.sign({ user }, jwtKey, (err, token) => {
            if (err) {
                res.send("Something went wrong! Try again later");
            } else {
                res.send({ user, auth: token });
            }
        })
    } else {
        res.send({ result: "No User Found" });
    }
})

app.post("/add-product", verifyToken, async (req, res) => {
    const product = new Product(req.body);
    let result = await product.save();
    res.send(result);
})

app.get("/products", verifyToken, async (req, res) => {
    const products = await Product.find();
    if (products.length) {
        res.send(products);
    } else {
        res.send({ result: "No Products Found" });
    }
})

app.delete("/product/:id", verifyToken, async (req, res) => {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send("Invalid product ID");
    }
    const result = await Product.deleteOne({ _id: req.params.id });
    res.send(result);
})

app.get("/product/:id", verifyToken, async (req, res) => {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send("Invalid product ID");
    }
    const result = await Product.findOne({ _id: productId });
    if (result) {
        res.send(result);
    } else {
        res.send({ result: "No Product Found." })
    }
})

app.put("/product/:id", verifyToken, async (req, res) => {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send("Invalid product ID");
    }
    const result = await Product.updateOne(
        { _id: productId },
        { $set: req.body }
    )
    res.send(result);
})

app.get("/search/:key", verifyToken, async (req, res) => {
    const result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
        ]
    });
    res.send(result);
})

function verifyToken(req, res, next) {
    let token = req.headers["authorization"];
    if (token) {
        Jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                res.status(401).send({ result: "Please provide valid token" });
            } else {
                next();
            }
        })
    } else {
        res.status(403).send({ result: "Please add token with headers" });
    }
}

app.listen(5000);