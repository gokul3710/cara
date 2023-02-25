var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");
const collections = require("../config/collections");
const ObjectID = require('mongodb').ObjectId

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
      if (user) {
        resolve({ signupErr: "Email is already regitered" })
      }
      else {
        userData.password = await bcrypt.hash(userData.password, 10);
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
          resolve(data)
        })
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {}
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user
            response.status = true
            resolve(response)
          } else {
            resolve({ status: false, loginErr: "Wrong Password" })
          }
        })
      } else {
        resolve({ status: false, loginErr: "Email is not registered" })
      }
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
      resolve(users)
    })
  },
  getUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectID(userId) })
      resolve(user)
    })
  },
  editUser: (user) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectID(user.userId) }, {
        $set: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          profileImage: true,
          address: {
            houseName: user.address.houseName,
            city: user.address.city,
            state: user.address.state,
            pincode: user.address.pincode,
            country: user.address.country
          }
        }
      }).then((response) => {
        resolve()
      })
    })
  },
  searchUser: (text) => {
    return new Promise(async (resolve, reject) => {
      let results = await db.get().collection(collections.USER_COLLECTION).find({ $text: { $search: text } }).toArray()
      resolve(results)
    })
  },
  deleteUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: ObjectID(userId) }).then((response) => {
        resolve(response)
      })
    })
  },
  addToCart: (productId, userId) => {
    productObj = {
      item: ObjectID(productId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectID(userId) })
      if (userCart) {
        let productExist = userCart.products.findIndex(product => product.item == productId)
        if (productExist != -1) {
          db.get().collection(collection.CART_COLLECTION)
            .updateOne({ user: ObjectID(userId), 'products.item': ObjectID(productId) },
              {
                $inc: { 'products.$.quantity': 1 }
              }
            ).then(() => {
              resolve();
            })
        } else {
          db.get().collection(collection.CART_COLLECTION)
            .updateOne({ user: ObjectID(userId) },
              {
                $push: { products: productObj }

              }
            ).then((response) => {
              resolve()
            })
        }
      } else {
        let cartObj = {
          user: ObjectID(userId),
          products: [productObj]
        }
        db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
          resolve()
        })
      }
    })
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartProducts = await db.get().collection(collections.CART_COLLECTION).aggregate([
        {
          $match: { user: ObjectID(userId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collections.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ['$product', 0] },
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: 1,
            total: { $multiply: ['$quantity', { $convert: { input: '$product.cPrice', to: 'int' } }] }
          }
        }
      ]).toArray()
      resolve(cartProducts)
    })
  },
  getTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
          $match: { user: ObjectID(userId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ['$product', 0] }
          }
        },
        {
          $group: {
            _id: null,
            totalPrice: { $sum: { $multiply: ['$quantity', { $convert: { input: '$product.cPrice', to: 'int' } }] } },
            totalQuantity: { $sum: { $multiply: ['$quantity', 1] } },
          }
        }
      ]).toArray()
      resolve(total[0])
    })
  },
  addCoupon: (coupon, userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collections.CART_COLLECTION).updateOne({ user: ObjectID(userId) }, {
        $set: {
          coupon: coupon
        }
      }).then((response) => {
        resolve()
      })
    })
  },
  checkout: (order, products, total) => {
    return new Promise((resolve, reject) => {
      let status = order['paymentMethod'] === 'COD' ? 'placed' : 'pending'
      let orderObj = {
        deliveryDetails: {
          name: order.firstName + ' ' + order.lastName,
          email: order.Email,
          phone: order.Phone,
          address: {
            houseName: order.address.houseName,
            city: order.address.city,
            state: order.address.state,
            pincode: order.address.pincode,
            country: order.address.country,
          },
          paymentMethod: order['paymentMethod'],
        },
        userId: ObjectID(order.userId),
        products: products,
        totalAmount: total.totalPrice,
        totalItems: total.totalQuantity,
        status: status,
        date: new Date()
      }
      db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
        db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectID(order.userId) });
        resolve()
      })
    })
  },
  viewOrders: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectID(userId) }).toArray().then((response) => {
        resolve(response)
      })
    })
  },
  viewOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { _id: ObjectID(orderId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        }
      ]).toArray()
      resolve(orderItems)
    })
  },
  removeFromCart: (data) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CART_COLLECTION)
        .updateOne({ user: ObjectID(data.userId) },
          {
            $pull: { products: { item: ObjectID(data.productId) } }
          }
        ).then((response) => {
          resolve({ removeProduct: true });
        })
    })
  },
  deleteUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: ObjectID(userId) }).then((r) => {
        db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectID(userId) }).then((response) => {
          resolve(response.deletedCount)
        })
      })
    })
  },
  editUserApi: (user) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectID(user.userId) }, {
        $set: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          address: {
            houseName: user.houseName,
            city: user.city,
            state: user.state,
            pincode: user.pincode,
            country: user.country
          }
        }
      }).then((response) => {
        resolve()
      })
    })
  },
  changeProductQuantity: (details) => {
    count = +details.count;
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CART_COLLECTION)
      .updateOne({ _id: ObjectID(details.cart), 'products.item': ObjectID(details.product) },
          {
            $inc: { 'products.$.quantity': count }
          }
        ).then((response) => {
          resolve(response);
        })
    })
  },
};
