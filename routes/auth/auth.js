const express         = require('express');
const authController = require('../../controllers/auth/auth');
const router  =express.Router();
const { check,body } = require('express-validator');
const User = require('../../models/user/user');

router.get('/login',authController.getLogin);

router.get('/signup',authController.getSignup);

router.post('/login',
    [
        body('email')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail(),
        body('password','Password has to be valid')
        .isLength({min:5})
        .isAlphanumeric()
        .trim(),
    ],
    authController.postLogin);

router.post('/signup',
    [
         check('email')
        .isEmail().
         withMessage('Please Enter With Email')
        .custom((value,{req})=>{
        // if(value === 'testss@mail'){
        //     throw new Error('this email addres if forbidden.')
        // }
        // return true;
         return User.findOne({email:value})
            .then((userDoc) => {
                if(userDoc){
                    return Promise.reject(
                         'Email exist already, please  pick a diffrent one'
                   );
                }
            })
       })
        .normalizeEmail(),
        body('password','Please enter a password with only numbers and text and least 5 characters')
        .isLength({min:5})
        .isAlphanumeric()
        .trim(),
        body('confirmPassword').custom((value,{req})=>{
           if(value !== req.body.confirmPassword){
              throw new Error('Password confirmation does not match password');
           }
           return true;
        })
    ],
    authController.postSignup
);

router.post('/logout',authController.postLogout);

router.get('/reset',authController.getReset);

router.post('/reset',authController.postReset);

router.get('/reset/:token',authController.getNewPassword);

router.post('/new-password',authController.postNewPassword);

module.exports=router;