var express = require("express");
var router = express.Router();
var userHelpers = require("../helpers/userHelpers");
const productHelpers = require("../helpers/productHelpers");

const userLogin = (req,res,next)=>{
  if(req.session.userLoggedIn || req.session.adminLogin){
    next()
  }else{
    res.redirect('/login')
  }
}

/* API. */

router.get("/api/products",(req, res, next) => {
  productHelpers.getAllProducts().then((products)=>{
    res.status(200).json(products)
  })
});


router.get("/api/product",(req, res, next) => {
  if(req.query.productId){
    productHelpers.getProduct(req.query.productId).then((product)=>{
      productHelpers.getCategoryProducts(product.company).then((products)=>{
        res.status(200).json([product,products])
      })
    })
  }
});

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
    if(response.signupErr){
      req.session.userSignupErr = response.signupErr
      res.status(401).json(response.signupErr)
    }else{
      req.session.userSignupErr = false
      req.session.userLoginErr = false
      res.status(200).json(true)
    }
  });
});








/* GET home page. */
router.get("/", function (req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render("user/index",{user:req.session.user,products});
  })
});

router.get("/signup", function (req, res, next) {
  if (req.session.userLoggedIn) {
    res.redirect("/");
  } else {
    res.render("user/signup",{signupErr:req.session.userSignupErr});
  }
});

router.get("/login", function (req, res, next) {
  if (req.session.userLoggedIn) {
    res.redirect("/");
  }else{
    res.render("user/login",{loginErr:req.session.userLoginErr});
  }
});

router.post("/signup", function (req, res, next) {
  userHelpers.doSignup(req.body).then((response) => {
    if(response.signupErr){
      req.session.userSignupErr = response.signupErr
      res.redirect('/signup')
    }else{
      req.session.userSignupErr = false
      req.session.userLoginErr = false
      res.redirect('/login')
    }
  });
});

router.post("/login", function (req, res, next) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userLoggedIn = true;
      req.session.user = response.user;
      req.session.userLoginErr = false
      req.session.userSignupErr = false
      res.redirect("/");
    } else {
      req.session.userLoginErr = response.loginErr
      res.redirect("/login");
    }
  });
});

router.get("/logout", function (req, res, next) {
  req.session.userLoggedIn = false;
  req.session.user = null;
  res.redirect('/')
});



router.get("/shop",userLogin, function (req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render("user/shop",{user:req.session.user,products});
  })
});

router.get("/cart",userLogin,  async(req, res, next)=> {
  if(req.session.user._id){
    let cart = await userHelpers.getTotal(req.session.user._id)
    userHelpers.getCartProducts(req.session.user._id).then((products)=>{
      res.render("user/cart",{user:req.session.user,products,cart});
    })
  }else{
    userHelpers.getCartProducts(req.session.user._id).then((products)=>{
      res.render("user/cart",{user:req.session.user,products,cart});
    })
  }
  
});

router.get("/blog", function (req, res, next) {
  res.render("user/blog",{user:req.session.user});
});

router.get("/about", function (req, res, next) {
  res.render("user/about",{user:req.session.user});
});

router.get("/contact", function (req, res, next) {
  res.render("user/contact",{user:req.session.user});
});

router.get("/product", userLogin, function (req, res, next) {
  if(req.query.productId){
    productHelpers.getProduct(req.query.productId).then((product)=>{
      productHelpers.getCategoryProducts(product.company).then((products)=>{
        console.log(products);
        res.render("user/product",{product,products})
      })
    })
  }else{
    res.redirect('/')
  }
});

router.get('/edit-user',userLogin,(req,res,next)=>{
  if(req.query.id){
    userHelpers.getUser(req.query.id).then((user)=>{
      res.render('user/edit-user',{user})
    })
  }else{
    res.redirect('/')
  }
})

router.post('/edit-user',(req,res,next)=>{
  userHelpers.editUser(req.body).then((response)=>{
    console.log(req.files);
    let image = req.files.image
    image.mv('./public/images/user-images/'+req.body.userId+'.png',(err,done)=>{
      if(!err){
        if(req.session.adminLogin){
          res.redirect('/admin')
        }else{
          res.redirect('/')
        }
      }else{
        console.log(err);
      }
    })
  
  })
})


router.get('/delete-user',userLogin,(req,res)=>{
  if(req.query.id){
    userHelpers.deleteUser(req.query.id).then((response)=>{
      if(req.session.adminLogin){
        res.redirect('/admin')
      }else{
        res.redirect('/')
      }
    })
  }
})

router.get('/add-to-cart',userLogin,(req,res,next)=>{
  if(req.query.productId){
    userHelpers.addToCart(req.query.productId,req.session.user._id).then(()=>{
      res.redirect('/cart')
    })
  }
})

router.post('/add-coupon',(req,res,next)=>{
  userHelpers.addCoupon(req.body.coupon,req.session.user._id).then(()=>{
    res.redirect('/cart')
  })
})

module.exports = router;
