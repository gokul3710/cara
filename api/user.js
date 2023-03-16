var express = require("express");
var router = express.Router();
var userHelpers = require("../helpers/userHelpers");
const jwt = require('jsonwebtoken');
const secret = 'your-secret-key';


function generateToken(user) {
  const payload = {
    userId: user._id,
    username: user.firstName+ " " + user.lastName   
  };


  const options = {
    expiresIn: '1h'
  };

  return jwt.sign(payload, secret, options);
}


const authorize = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).send("Authorization header not found");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send("Token not found");
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send("Invalid token");
  }
};


/* API. */

router.get('/api/user', authorize,(req, res, next) => {
    if (req.query.userId) {
        userHelpers.getUser(req.query.userId).then((user) => {
            res.status(200).json(user)
        })
    }
})

router.post("/api/user/login", function (req, res, next) {
    userHelpers.doLogin(req.body).then((response) => {
        if (response.status) {
            const token = generateToken(response.user)
            res.status(200).json([response.user,token])
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

router.get("/api/user/cart",authorize, async (req, res, next) => {
    if (req.query.userId) {
        let cartTotal = await userHelpers.getTotal(req.query.userId)
        userHelpers.getCartProducts(req.query.userId).then((products) => {
            res.status(200).json([products, cartTotal])
        })
    }
});

router.get("/api/user/cart/total",authorize, async (req, res, next) => {
    if (req.query.userId) {
        let cartTotal = await userHelpers.getTotal(req.query.userId)
        res.status(200).json(cartTotal)
    }
});


router.get('/api/user/add-to-cart',authorize, (req, res, next) => {
    if (req.query.productId && req.query.userId) {
        userHelpers.addToCart(req.query.productId, req.query.userId).then(() => {
            res.status(200).json(true)
        })
    }
})

router.post('/api/user/checkout', authorize,async (req, res) => {
    let products = await userHelpers.getCartProducts(req.body.userId)
    let total = await userHelpers.getTotal(req.body.userId)
    userHelpers.checkout(req.body, products, total).then((response) => {
        res.status(200).json({ status: true })
    })
})

router.get('/api/user/orders',authorize, (req, res) => {
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

router.get('/api/user/order/products',authorize, (req, res) => {
    userHelpers.viewOrderProducts(req.query.orderId).then((products) => {
        res.status(200).json(products)
    })
})

router.post('/api/user/remove-from-cart',authorize, (req, res) => {
    userHelpers.removeFromCart(req.body).then((response) => {
        res.status(200).json(response)
    })
})

router.post('/api/user/delete',authorize, (req, res, next) => {
    userHelpers.deleteUser(req.body.userId).then((response) => {
        res.status(200).json(response)
    })
})

router.post('/api/user/edit',authorize, (req, res, next) => {
    userHelpers.editUserApi(req.body).then((response) => {
        let image = req.files.image
        image.mv('./public/images/user-images/' + req.body.userId + '.png', (err, done) => {
            if (!err) {
                res.status(200).json(response) 
            } else {
                res.status(400).json("Error Uploading Image")
            }
        })
    })
})

router.post('/api/user/cart/change-quantity',authorize, (req, res, next) => {
    userHelpers.changeProductQuantity(req.body).then((response) => {
        res.status(200).json(response)
    })
})





module.exports = router;
