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
    console.log(req.body);
    userHelpers.doLogin(req.body).then((response) => {
        if (response.status) {
            req.session.userLoggedIn = true;
            req.session.user = response.user;
            req.session.userLoginErr = false
            req.session.userSignupErr = false
            console.log(true);
            res.status(200).json(req.session.user)
        } else {
            console.log(false);
            console.log(response.loginErr);
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
    } else {
        userHelpers.getCartProducts(req.session.user._id).then((products) => {
            res.render("user/cart", { user: req.session.user, products, cart });
        })
    }

});

router.get('/api/user/add-to-cart', (req, res, next) => {
    if (req.query.productId && req.query.userId) {
        console.log(req.query);
        userHelpers.addToCart(req.query.productId, req.query.userId).then(() => {
            res.status(200).json(true)
        })
    }
})


module.exports = router;
