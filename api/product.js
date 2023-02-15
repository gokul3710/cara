var express = require('express');
const userHelpers = require('../helpers/userHelpers');
const productHelpers = require('../helpers/productHelpers');
var router = express.Router();


/* PRODUCT API. */

router.get("/api/products", (req, res, next) => {
    productHelpers.getAllProducts().then((products) => {
        res.status(200).json(products)
    })
});


router.get("/api/product", (req, res, next) => {
    if (req.query.productId) {
        productHelpers.getProduct(req.query.productId).then((product) => {
            productHelpers.getCategoryProducts(product.company).then((products) => {
                res.status(200).json([product, products])
            })
        })
    }
});

module.exports = router;
