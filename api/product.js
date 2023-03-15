const express = require('express');
const productHelpers = require('../helpers/productHelpers');
const router = express.Router();
const jwt = require('jsonwebtoken');
const secret = 'your-secret-key';


function generateToken(user) {
  const payload = {
    userId: user._id,
    username: user.firstName+ " " + user.lastName   
  };
  console.log(payload);


  const options = {
    expiresIn: '1h'
  };

  return jwt.sign(payload, secret, options);
}


const authorize = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log("Authorization header not found");
    return res.status(401).send("Authorization header not found");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("Token not found");
    return res.status(401).send("Token not found");
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Invalid token");
    res.status(401).send("Invalid token");
  }
};


/* PRODUCT API. */

router.get("/api/products", authorize,(req, res, next) => {
    productHelpers.getAllProducts().then((products) => {
        res.status(200).json(products)
    })
});


router.get("/api/product",authorize, (req, res, next) => {
    if (req.query.productId) {
        productHelpers.getProduct(req.query.productId).then((product) => {
            productHelpers.getCategoryProducts(product.company).then((products) => {
                res.status(200).json([product, products])
            })
        })
    }
});

router.post('/api/products/search',authorize,(req,res,next)=>{
    if(req.body.searchKey) {
        console.log(req.body);
        productHelpers.searchProduct(req.body.searchKey).then((products)=>{
            console.log(products);
            res.status(200).json(products)
        })
    }
})

module.exports = router;
