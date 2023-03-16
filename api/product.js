const express = require('express');
const productHelpers = require('../helpers/productHelpers');
const router = express.Router();


/* PRODUCT API. */

router.get("/api/products",(req, res, next) => {
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

router.post('/api/products/search',(req,res,next)=>{
    if(req.body.searchKey) {
        productHelpers.searchProduct(req.body.searchKey).then((products)=>{
            res.status(200).json(products)
        })
    }
})

module.exports = router;
