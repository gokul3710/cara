var express = require("express");
var router = express.Router();
var userHelpers = require("../helpers/userHelpers");
const productHelpers = require("../helpers/productHelpers");

/* API. */

router.get('/api/user', (req, res, next) => {
    if (req.query.userId) {
        userHelpers.getUser(req.query.userId).then((user) => {
            res.status(200).json(user)
        })
    }
})

router.post("/api/user/login", function (req, res, next) {
    userHelpers.doLogin(req.body).then((response) => {
        if (response.status) {
            req.session.userLoggedIn = true;
            req.session.user = response.user;
            req.session.userLoginErr = false
            req.session.userSignupErr = false
            res.status(200).json(req.session.user)
        } else {
            res.status(401).json(response.loginErr)
        }
    });
});

router.post("/api/user/signup", function (req, res, next) {
    userHelpers.doSignup(req.body).then((response) => {
        if (response.signupErr) {
            req.session.userSignupErr = response.signupErr
            res.status(401).json(response.signupErr)
        } else {
            req.session.userSignupErr = false
            req.session.userLoginErr = false
            res.status(200).json(true)
        }
    });
});

router.get("/api/user/cart", async (req, res, next) => {
    if (req.query.userId) {
        let cartTotal = await userHelpers.getTotal(req.query.userId)
        userHelpers.getCartProducts(req.query.userId).then((products) => {
            res.status(200).json([products, cartTotal])
        })
    }
});

router.get("/api/user/cart/total", async (req, res, next) => {
    if (req.query.userId) {
        let cartTotal = await userHelpers.getTotal(req.query.userId)
        res.status(200).json(cartTotal)
    }
});


router.get('/api/user/add-to-cart', (req, res, next) => {
    if (req.query.productId && req.query.userId) {
        userHelpers.addToCart(req.query.productId, req.query.userId).then(() => {
            res.status(200).json(true)
        })
    }
})

router.post('/api/user/checkout', async (req, res) => {
    let products = await userHelpers.getCartProducts(req.body.userId)
    let total = await userHelpers.getTotal(req.body.userId)
    userHelpers.checkout(req.body, products, total).then((response) => {
        res.status(200).json({ status: true })
    })
})

router.get('/api/user/orders', (req, res) => {
    userHelpers.viewOrders(req.query.userId).then((orders) => {
        orders.forEach(order => {
            order.date = order.date.toString()
            order.time = order.date.slice(16, 24)
            order.day = order.date.toString().slice(4, 15)
            order.date = order.date.slice(0, 15)
        })
        res.status(200).json(orders)
    })
})

router.get('/api/user/order/products', (req, res) => {
    userHelpers.viewOrderProducts(req.query.orderId).then((products) => {
        res.status(200).json(products)
    })
})

router.post('/api/user/remove-from-cart', (req, res) => {
    userHelpers.removeFromCart(req.body).then((response) => {
        res.status(200).json(response)
    })
})

router.post('/api/user/delete', (req, res, next) => {
    userHelpers.deleteUser(req.body.userId).then((response) => {
        res.status(200).json(response)
    })
})

router.post('/api/user/edit', (req, res, next) => {
    userHelpers.editUserApi(req.body).then((response) => {
        let image = req.files.image
        image.mv('./public/images/user-images/' + req.body.userId + '.png', (err, done) => {
            if (!err) {
                res.status(200).json(response) 
            } else {
                console.log(err);
                res.status(400).json("Error Uploading Image")
            }
        })
    })
})

router.post('/api/user/cart/change-quantity', (req, res, next) => {
    userHelpers.changeProductQuantity(req.body).then((response) => {
        res.status(200).json(response)
    })
})





module.exports = router;
