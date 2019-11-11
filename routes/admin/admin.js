const path            = require('path');
const express         = require('express');
const adminController = require('../../controllers/admin/admin');
const isAuth          = require('../../middleware/is-auth');
const router  =express.Router();
const { body } = require('express-validator');

// /admin/add-product => get
 router.get('/add-product',isAuth,adminController.getAddProduct);

// // /admin/products => Get
router.get('/products',isAuth,adminController.getProducts);



// // /admin/add-product => POST
router.post('/add-product',[
        body('title')
          .isString()
          .isLength({min:3})
          .trim(),
        body('price')
          .isFloat(),
        body('description')
          .isString()
          .isLength({min:5,max:200})
          .trim()
],isAuth,adminController.postAddProduct);


router.get('/edit-product/:productId',isAuth,adminController.getEditProduct);

router.post('/edit-product',[
        body('title')
          .isString()
          .isLength({min:3})
          .trim(),
        body('price')
          .isFloat(),
        body('description')
          .isString()
          .isLength({min:5})
          .trim()

],isAuth,adminController.postEditProduct);

//router.post('/delete-product',isAuth,adminController.postDeleteProduct);

router.delete('/product/:productId',isAuth,adminController.DeleteProduct);

module.exports = {
  router
};