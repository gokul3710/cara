var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const collections = require("../config/collections");
const { response } = require("express");
const  ObjectID  = require('mongodb').ObjectId

module.exports= {
    addProduct: (product)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
                resolve(data.insertedId)
            })
        })  
    },
    getAllProducts: ()=>{
        return new Promise(async(resolve,reject)=>{
            let products =await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getProduct: (productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:ObjectID(productId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    searchProduct: (text)=>{
        return new Promise(async(resolve,reject)=>{
          let results = db.get().collection(collections.PRODUCT_COLLECTION).find({$text: {$search : text}}).toArray()
          resolve(results)
        })
      },
    deleteProduct:(productId)=>{
        return new Promise((resolve,reject) =>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:ObjectID(productId)}).then((response)=>{
                resolve(response)
            })
        }) 
    },
    editProduct:(product)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:ObjectID(product.productId)},{
                $set:{
                    name:product.name,
                    company:product.company,
                    cPrice:product.cPrice,
                    mPrice:product.mPrice,
                    material:product.material,
                    commodity:product.commodity,
                    dHeight:product.dHeight,
                    dWidth:product.dWidth
                }
            }).then((response)=>{
                resolve(product.productId)
            })
        })
    },
    getCategoryProducts:(category)=>{
        return new Promise(async(resolve,reject)=>{
            let categoryProducts = await db.get().collection(collections.PRODUCT_COLLECTION).find({company:category}).toArray()
            resolve(categoryProducts)
        })
    }


    // getCount:(a)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         let details = await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
    //             {
    //                 $group:{
    //                     _id:'$'+a,
    //                     count:{$sum:1}
    //                 }
    //             }
    //         ]).toArray()
    //         resolve(details)
    //     })
    // },
    // startsWith:()=>{
    //     return new Promise(async(resolve,reject)=>{
    //         let products = await db.get().collection(collections.USER_COLLECTION).find({firstName: /^J/i}).toArray()
    //         resolve(products)
    //     })
    // },
    
    
}
