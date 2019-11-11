const fs      = require('fs');
const path    = require('path');
const PDFdocumnet  =require('pdfkit');
const Product = require('../../models/product/product');
const Order   = require('../../models/order/order');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const ITEM_PER_PAGE =6;

exports.getProducts = (req, res, next)=>{
    const page = +req.query.page || 1;

    let totalItems;
    Product.find().countDocuments().then(numbherProduct=>{
    totalItems=numbherProduct;
         return   Product.find()
                 .skip((page - 1) * ITEM_PER_PAGE)
                 .limit(ITEM_PER_PAGE)
    }).then((products) => {
         res.render('shop/product-list',{
             prods      :products,
             pageTitle  :'All Products',
             path       :'/products',
             currentPage:page,
             hasNextPage  : ITEM_PER_PAGE * page < totalItems,
             hasPrevious  : page > 1,
             nextPage     : page + 1,
             PreviousPage : page - 1,
             lastPage     : Math.ceil(totalItems / ITEM_PER_PAGE)
      });
    }).catch((err) => {
             console.log(err);
    });
}

exports.getProduct = (req, res, next)=>{
   const prodId   =req.params.productId;
   Product.findById(prodId)
   .then(product => {
    console.log(product);
    res.render('shop/product-detail',{
        product  :product,
        pageTitle:product.title,
        path     :'/products',
    });
   }).catch((err) => {
       console.log(err)
   });

}

exports.getIndex =(req,res,next)=>{
   const page = +req.query.page || 1;

   let totalItems;
   Product.find().countDocuments().then(numbherProduct=>{
   totalItems=numbherProduct;
        return   Product.find()
                .skip((page - 1) * ITEM_PER_PAGE)
                .limit(ITEM_PER_PAGE)
   }).then((products) => {
        res.render('shop/index',{
            prods      :products,
            pageTitle  :'Shop',
            path       :'/',
            currentPage:page,
            hasNextPage  : ITEM_PER_PAGE * page < totalItems,
            hasPrevious  : page > 1,
            nextPage     : page + 1,
            PreviousPage : page - 1,
            lastPage     : Math.ceil(totalItems / ITEM_PER_PAGE)
     });
   }).catch((err) => {
            console.log(err);
   });
}

exports.getCart =(req,res,next)=>{
   req.user
    .populate('cart.items.productId')
        .execPopulate()
        .then((user) => {
            const products=user.cart.items;
            res.render('shop/cart',{
                path : '/cart',
                pageTitle : 'Your Cart',
                products :products,
            });
        }).catch((err) => {
            console.log(err);
        });


}

exports.postCart =(req,res,next)=>{
    const prodId = req.body.productId;
    Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    }).catch(err=>{
        console.log(err);
    });
    // let fetchedCart;
    // let newQuantity= 1;
    // req.user.getCart()
    // .then((cart) => {
    //     fetchedCart = cart;
    //     return cart.getProducts({where:{id:prodId}});
    // }).then(products =>{
    //     let product;
    //     if(products.length > 0){
    //         product = products[0];
    //     }
    //     if(product){
    //        const oldQuantity = product.cartItem.quantity;
    //        newQuantity = oldQuantity + 1;
    //        return product;
    //     }
    //     return Product.findByPk(prodId)
    // })
    // .then(product =>{
    //     return fetchedCart.addProduct(product,{
    //         through :{quantity: newQuantity}
    //     })
    // })
    // .then(()=>{
    //     res.redirect('/cart');
    // })
    // .catch(err =>console.log(err));
}

exports.postCartDeleteProduct=(req,res,next)=>{
        const prodId= req.body.productId;
        req.user.removeFromCart(prodId)
        .then(result=>{
            res.redirect('/cart');
        })
        .catch((err) => {
            console.log(err);
        });
}

exports.getChekout=(req,res,next)=>{
    req.user
    .populate('cart.items.productId')
        .execPopulate()
        .then((user) => {
            const products=user.cart.items;
            let total=0;
            products.forEach(p=>{
               total += p.quantity * p.productId.price;
            })
            res.render('shop/checkout',{
                path      : '/checkout',
                pageTitle : 'Checkout',
                products  : products,
                totalSum  : total
            });
        }).catch((err) => {
            console.log(err);
        });
}

exports.postOrder = (req,res,next)=>{
    const token = req.body.stripeToken; // Using Express
    let totalSum= 0;
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        user.cart.items.forEach(p=>{
            totalSum += p.quantity * p.productId.price;
        });
        const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: {...i.productId._doc } };
      });
      const order= new Order(
        {
            user:{
                email:req.user.email,
                userId:req.user
            },
            products:products
        });
        return order.save()
        }).then(result=>{
            const charge = stripe.charges.create({
                amount: totalSum * 100,
                currency: 'usd',
                description: 'Demo Order',
                source: token,
                metadata: { order_id: result._id.toString() }
             });
            return  req.user.clearCart()
        }).then(()=>{
            res.redirect('/orders');
        })
        .catch((err) => {
            console.log(err);
        });
}


exports.getOrders =(req,res,next)=>{
    Order.find({"user.userId":req.session.user})
    .then(orders=>{
        res.render('shop/orders',{
            path : '/orders',
            pageTitle : 'Your Orders',
            orders:orders,
       });
    }).catch((err) => {
        console.log(err);
    });

}
exports.getInvoice=(req,res,next)=>{
    const orderId = req.params.orderId;
    Order.findById(orderId)
    .then((order) => {
        if(!order){
            return next(new Error('No order Found'));
        }
      if(order.user.userId.toString() !== req.user._id.toString()){
            return next(new Error('Unauthorized'));
      }
    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data','invoices', invoiceName);

    const pdfDoc = new PDFdocumnet();

    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Dispotiotion','inline; filename="' + invoiceName +'"');

    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text('Invoice',{
        underline:true
    });
    pdfDoc.text('========================');
    let totalPrice = 0
    order.products.forEach(prod => {
        totalPrice  +=  prod.quantity * prod.product.price;
        pdfDoc.fontSize(14).text(prod.product.title + '  =  ' + prod.quantity + ' x ' + ' $ ' + prod.product.price)
    });
    pdfDoc.text('===');
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

    pdfDoc.end();
        // fs.readFile(invoicePath,(err,data)=>{
        //         if(err){
        //         return  next(err);
        //         }
        //     res.setHeader('Content-Type','application/pdf');
        //     res.setHeader('Content-Dispotiotion','inline; filename="' + invoiceName +'"');
        //     res.send(data);
        // })
        // const file = fs.createReadStream(invoicePath);
        //     res.setHeader('Content-Type','application/pdf');
        //     res.setHeader('Content-Dispotiotion','inline; filename="' + invoiceName +'"');
        //     file.pipe(res)
    })
    .catch((err) => {
        next(err)
    });
}