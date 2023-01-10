var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");
const collections = require("../config/collections");
const  ObjectID  = require('mongodb').ObjectID

module.exports = {
  doSignup: (userData) => {
    return new Promise(async(resolve, reject) => {
        let user = await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
        if(user){
            resolve({signupErr:"Email is already regitered"})
        }
        else{
            userData.password = await bcrypt.hash(userData.password, 10);
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data)
            })
        }
    });
  },
  doLogin: (userData) => {
    return new Promise(async(resolve, reject) => {
        let response = {}
        let user = await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
        if(user){
            bcrypt.compare(userData.password,user.password).then((status)=>{
            if(status){
                response.user = user
                response.status = true
                resolve(response)
            }else{
                resolve({status : false,loginErr: "Wrong Password"})
            }
        })
      }else{
        resolve({status : false,loginErr: "Email is not registered"})
      }
    });
  },
  getAllUsers: ()=>{
    return new Promise (async(resolve,reject)=>{
        let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
        resolve(users)
    })
  },
  getUser: (userId)=>{
    return new Promise ((resolve,reject)=>{
      db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectID(userId)}).then((user)=>{
        resolve(user)
      })
    })
  },
  editUser: (user)=>{
    return new Promise ((resolve,reject)=>{
      db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectID(user.userId)},{
        $set:{
          firstName:user.firstName,
          lastName:user.lastName,
          email:user.email,
          phone:user.phone,
          profileImage: true,
          address:{
            houseName:user.address,
            city:user.city,
            state:user.state,
            pincode:user.pincode
          }
        }
      }).then((response)=>{
        resolve()
      })
    })
  },
  searchUser: (text)=>{
    return new Promise(async(resolve,reject)=>{
      let results = await db.get().collection(collections.USER_COLLECTION).find({$text: {$search : text}}).toArray()
      resolve(results)
    })
  },
  deleteUser:(userId)=>{
    return new Promise((resolve,reject) =>{
        db.get().collection(collection.USER_COLLECTION).deleteOne({_id:ObjectID(userId)}).then((response)=>{
            resolve(response)
        })
    }) 
  },
  addToCart:(productId,userId)=>{
    productObj={
        item:ObjectID(productId),
        quantity:1
    }
    return new Promise(async(resolve,reject)=>{
        let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userId)})
        if(userCart){
            let productExist= userCart.products.findIndex(product=> product.item==productId)
            if(productExist!=-1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:ObjectID(userId),'products.item':ObjectID(productId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    resolve();
                })
            }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:ObjectID(userId)},
                    {
                        $push:{products:productObj}
                        
                    }
                ).then((response)=>{
                    resolve()
                })
            }
        }else{
            let cartObj={
                user:ObjectID(userId),
                products:[productObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                resolve()
            })
        }
    })
  },
  getCartProducts: (userId)=>{
    console.log(userId);
    return new Promise(async(resolve,reject)=>{
      let cartProducts = await db.get().collection(collections.CART_COLLECTION).aggregate([
        {
          $match:{user:ObjectID(userId)}
        },
        {
          $unwind:'$products'
        },
        {
          $project:{
            item:'$products.item',
            quantity:'$products.quantity'
          }
        },
        {
          $lookup:{
            from: collections.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project:{
              item:1,
              quantity:1,
              product:{$arrayElemAt:['$product',0]},
          }
        },
        {
          $project:{
            item:1,
            quantity:1,
            product:1,
            total:{$multiply:['$quantity',{$convert:{input:'$product.cPrice',to:'int'}}]}
          }
        }
      ]).toArray()
      // console.log(cartProducts);
      resolve(cartProducts)
    })
  },
  getTotal:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let total= await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:ObjectID(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,
                    quantity:1,
                    product:{$arrayElemAt:['$product',0]}
                }
            },
            {
                $group:{
                    _id:null,
                    totalPrice:{$sum:{$multiply:['$quantity',{$convert:{input:'$product.cPrice',to:'int'}}]}},
                    totalQuantity:{$sum:{$multiply:['$quantity',1]}},
                }
            }
        ]).toArray()
        resolve(total[0])
    })
  },
  addCoupon: (coupon,userId)=>{
    console.log(coupon);
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.CART_COLLECTION).updateOne({user:ObjectID(userId)},{
        $set:{
          coupon:coupon
        }
      }).then((response)=>{
        resolve()
      })
    })
  }
  
};
