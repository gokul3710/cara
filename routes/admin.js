var express = require('express');
const userHelpers = require('../helpers/userHelpers');
const productHelpers = require('../helpers/productHelpers');
var router = express.Router();

const adminLogin =(req,res,next)=>{
  if(req.session.adminLogin){
    next()
  }else{
    res.redirect('/admin-login')
  }
}

const validateAdmin =(admin)=>{
  if(admin.email != "admin@cara.com") return [false,"Wrong Email Address"]
  if(admin.password != "123") return [false,"Wrong Password"]
  return [true,"Logged In Successfully"]
}

/* GET admin listing. */
router.get('/admin', adminLogin, function(req, res, next) {
  userHelpers.getAllUsers().then((users)=>{
    res.render('admin/index' , {admin:req.session.adminLogin,users});
  })
});

router.get('/admin-login', function(req, res, next) {
  if(req.session.adminLogin){
    res.render('/admin');
  }else{
    res.render('admin/login',{loginErr:req.session.adminLoginErr})
  }
});

router.post('/admin-login', function(req, res, next) {
  let validate = validateAdmin(req.body)
  if(validate[0]){
    req.session.adminLogin = true;
    req.session.userLoggedIn = false;
    req.session.user = null
    res.redirect('/admin')
  }else{
    req.session.adminLoginErr = validate[1]
    res.redirect('/admin-login')
  }
});

router.get('/admin-logout',(req,res,next)=>{
  req.session.adminLogin = null
  res.redirect('/')
})

router.get('/add-product',adminLogin,(req,res,next)=>{
  res.render('admin/add-product',{admin:req.session.adminLogin})
})

router.post('/add-product',(req,res,next)=>{
  console.log(req)
  productHelpers.addProduct(req.body).then((id)=>{
    let image = req.files.image
    image.mv('./public/product-images/'+id+'.png',(err,done)=>{
      if(!err){
        res.redirect('/add-product')
      }else{
        console.log(err);
      }
    })
  })
})

router.get('/products',adminLogin,(req,res,next)=>{
  productHelpers.getAllProducts().then((products)=>{
    console.log(products);
    res.render('admin/products',{products,admin:req.session.adminLogin})
  })
})

router.get('/user-search',adminLogin,(req,res,next)=>{
  userHelpers.searchUser(req.query.text).then((users)=>{
    res.render('admin/index' , {admin:req.session.adminLogin,users});
  })
})

router.get('/product-search',adminLogin,(req,res,next)=>{
  console.log(req.query.text);
  productHelpers.searchProduct(req.query.text).then((products)=>{
    res.render('admin/products',{admin:req.session.adminLogin,products})
  })
})

router.get('/edit-product',adminLogin,(req,res,next)=>{
  if(req.query.id){
    productHelpers.getProduct(req.query.id).then((product)=>{
      res.render('admin/edit-product',{product})
    })
  }
})

router.post('/edit-product',(req,res,next)=>{
  productHelpers.editProduct(req.body).then((response)=>{
    res.redirect('/products')
  })
})

router.get('/delete-product',adminLogin,(req,res,next)=>{
  if(req.query.id){
    productHelpers.deleteProduct(req.query.id).then((response)=>{
      res.redirect('/products')
    })
  }
})



module.exports = router;
