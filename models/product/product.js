// // const db   = require('../../utils/database');

// // module.exports = class Product {
// //     constructor(id,title,imageUrl,description,price){
// //         this.id=id;
// //         this.title = title;
// //         this.imageUrl=imageUrl;
// //         this.description=description;
// //         this.price=price;
// //     }

// //     save(){
// //     return db.execute('INSERT INTO products (title,price,imageUrl,description) VALUES (?,?,?,?)',[
// //            this.title,this.price,this.imageUrl,this.description
// //        ]);
// //     }

// //     static deleteById(id){

// //     }

// //    static fetchAll(){
// //     return db.execute('SELECT * FROM products');

// //    }

// //    static findById(id){
// //       return db.execute('SELECT * FROM products WHERE products.id = ?',[id]);
// //    }

// // }

// // const Sequelize = require('sequelize');

// // const sequelize = require('../../utils/database');

// // const Product = sequelize.define('product',{
// //     id:{
// //         type:Sequelize.INTEGER,
// //         autoIncrement:true,
// //         allowNull :false,
// //         primaryKey:true
// //     },
// //     title:{
// //         type  : Sequelize.STRING,
// //     },
// //     price:{
// //         type: Sequelize.DOUBLE,
// //         allowNull:false
// //     },
// //     imageUrl:{
// //         type:Sequelize.TEXT,
// //         allowNull:false
// //     },
// //     description:{
// //         type:Sequelize.STRING,
// //         allowNull:false
// //     }
// // });

// // module.exports = Product;
// const getDb = require('../../utils/database').getDb;
// const mongoDb = require('mongodb');

// class Product{
//     constructor(title,price,description,imageUrl,id,userId) {
//         this.title=title;
//         this.price=price;
//         this.description=description;
//         this.imageUrl=imageUrl;
//         this._id= id ? new mongoDb.ObjectId(id) : null;
//         this.userId=userId;
//     }

//     save(){
//         const db = getDb();
//         let dbOp;
//         if(this._id){
//              dbOp = db.collection('products').updateOne( {_id:this._id}, {$set: this} );
//         }else{
//              dbOp = db.collection('products').insertOne(this);
//         }
//         return dbOp
//         .then((result) => {
//             console.log(result);
//         }).catch((err) => {
//             console.log(err);
//         });
//     }

//     static fetchAll(){
//         const db = getDb();
//         return db.collection('products').find().toArray()
//         .then((products) => {
//             console.log(products);
//             return products;
//         }).catch((err) => {
//              console.log(err)
//         });
//     }

//     static findById(prodId){
//         const db = getDb();
//         return db.collection('products').find({_id:new mongoDb.ObjectId(prodId)}).next()
//         .then((product) => {
//             console.log(product);
//             return product;
//         }).catch((err) => {
//            console.log(err);
//         });
//     }

//     static deleteById(prodId){
//         const db = getDb();
//         return db.collection('products').deleteOne( {_id: new mongoDb.ObjectId(prodId)} )
//         .then((result) => {
//              console.log('Deleted');
//         }).catch((err) => {
//            console.log(err);
//         });
//     }


// }
// module.exports= Product

const mongoose      = require('mongoose');
const Schema        =mongoose.Schema;
const productSchema = new Schema({
    title:{
        type :String,
        required:true,
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type :String,
        required:true
    },
    imageUrl:{
        type :String,
        required:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref :'User',
        required:true
    }
});
module.exports =mongoose.model('Product',productSchema);