const Product                   = require('../../models/product/product');
const { validationResult }      = require('express-validator');
const mongoose                  = require('mongoose');
const fileHelper                = require('../../utils/file');


const ITEM_PER_PAGE =6;
exports.getAddProduct = (req, res, next)=>{
    if(!req.session.isLoggedIn){
        return res.redirect('/login');
    }
    res.render('admin/edit-product',{
      pageTitle  :'add Products',
      path       :'/admin/add-product',
      editing    :false,
      product    :'',
      hasError   :false,
      errorMessage:null,
      validationErrors:[]
    });
}

exports.postAddProduct=(req,res,next)=>{
    const title       = req.body.title;
    const image       = req.file;
    const price       = req.body.price;
    const description = req.body.description;
    if(!image){
        return res.status(422).render('admin/edit-product',{
            pageTitle  :'Add Products',
            path       :'/admin/add-product',
            editing    :false,
            hasError   :true,
            product    :{
                title:title,
                price:price,
                description:description,

            },
            errorMessage: 'Attcahed Fail is not an image',
            validationErrors:[]
          });
    }

    const errors      = validationResult(req);
    if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product',{
            pageTitle  :'Add Products',
            path       :'/admin/add-product',
            editing    :false,
            hasError   :true,
            product    :{
                title:title,
                price:price,
                description:description,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors:errors.array()
          });
    }

    const imageUrl= image.path;
    console.log(req.file);
    const product     = new Product({
        title       :title,
        price       :price,
        description :description,
        imageUrl    :imageUrl,
        userId      : req.user
    });
    product.save()
    .then((result) => {
        console.log('Created Product');
        res.redirect('/admin/products');
    }).catch((err) => {
        console.log(err);
    });

}


exports.getEditProduct = (req, res, next)=>{
    const editMode = req.query.edit;
    if(!editMode){
       return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then((product) => {
        if(!product){
            return redirect('/');
        }
        res.render('admin/edit-product',{
            pageTitle  :'Edit Products',
            path       :'/admin/edit-product',
            editing    :editMode,
            product     :product,
            hasError   :false,
            errorMessage:null,
            validationErrors:[]
          });
    }).catch((err) => {
        res.redirect('/500');
        console.log(err);
    });
}

exports.postEditProduct=(req,res,next)=>{
    const prodId             = req.body.productId;
    const updatedTitle       = req.body.title;
    const image    = req.file;
    const updatedprice       = req.body.price;
    const updateddescription = req.body.description;

    const errors      = validationResult(req);
    if(!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render('admin/edit-product',{
            pageTitle  :'Edit Products',
            path       :'/admin/edit-product',
            editing    :true,
            hasError   :true,
            product    :{
                title:updatedTitle,
                price:updatedprice,
                description:updateddescription,
                _id:prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors:errors.array()
          });
    }

    Product.findById(prodId)
    .then(product=>{
        if(product.userId.toString() !== req.user._id.toString()){
            return res.redirect('/');
        }
        product.title=updatedTitle;
        product.price=updatedprice;
        product.description=updateddescription;
        if(image){
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl=image.path;
        }
        return product.save()
        .then(result => {
            console.log('updated product');
            res.redirect('/admin/products');
         })
    })
    .catch((err) => {
          console.log(err);
    });
}


exports.getProducts =(req,res,next)=>{
    const page = +req.query.page || 1;
    let totalItems;
//    .select('title price -_id')
//    .populate('userId','name')
    Product.find({userId:req.user._id}).countDocuments()
   .then((numbherProduct) => {
    totalItems=numbherProduct;
    return   Product.find()
                    .skip((page - 1) * ITEM_PER_PAGE)
                    .limit(ITEM_PER_PAGE)
    .then(products=>{
        res.render('admin/products',{
            prods :products,
            pageTitle    :'Admin Products',
            path         :'/admin/products',
            currentPage  :page,
            hasNextPage  : ITEM_PER_PAGE * page < totalItems,
            hasPrevious  : page > 1,
            nextPage     : page + 1,
            PreviousPage : page - 1,
            lastPage     : Math.ceil(totalItems / ITEM_PER_PAGE)
        });
    })
   }).catch((err) => {
       console.log(err);
   });
}

exports.DeleteProduct =(req,res,next)=>{
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then((product) => {
        if(!product){
            return next(new Error('Product Not Founf'));
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({_id:prodId,userId:req.user._id})
    }).then((result) => {
        console.log('DESTROYED PRODUCT');
        res.status(200).json({message:'Success!'});
     })
     .catch((err) => {
         res.status(500).json({message:'Deleting Product failed!'});
     });
}