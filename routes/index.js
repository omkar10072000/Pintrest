var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const { default: mongoose } = require('mongoose');
const localStrategy = require("passport-local");
const passport = require("passport");
passport.use(new localStrategy(userModel.authenticate()));
const upload = require('./multer'); // Import the Multer middleware setup
// Handle file upload
const { MongoClient } = require('mongodb');

// Connection URI
const uri = 'mongodb://127.0.0.1:27017/';

// Database Name
const dbName = 'pintrest';

// Create a new MongoClient
const client = new MongoClient(uri);









// router.post('/upload', isLoggedIn , upload.single('file'),async function (req, res , next){
// // Access the uploaded file details via req.file
// if (!req.file) {
// return res.status(400).send('No files were uploaded.');
// }
// res.send('File uploaded successfully!');
 
   
//    const user = await userModel.findOne({username : req.session.passport.user});
//    const post = await postModel.create( {
//     image : req.file.filename,
//     imageText : req.body.filecaption,
//     user : user._id,
//    });
//    console.log("user ----------");
//    console.log(user);
//    console.log("post ----------");
//    console.log(post);
//    user.posts.push(post._id);
//    res.send('profile done');
//    saved = await user.save();
//    res.render('profile');

// });
/* GET home page. */
router.post('/upload', isLoggedIn, upload.single('file'), async function (req, res, next) {
  try {
      if (!req.file) {
          return res.status(400).send('No files were uploaded.');
      }

      const user = await userModel.findOne({ username: req.session.passport.user });
      if (!user) {
          return res.status(404).send('User not found.');
      }

      const post = await postModel.create({
          image: req.file.filename,
          imageText: req.body.filecaption,
          user: user._id,
      });

      console.log("user ----------");
      console.log(user);
      console.log("post ----------");
      console.log(post);

      user.posts.push(post._id);
      await user.save();
      res.setHeader('Location', '/profile');
        res.statusCode = 302; 
      if (!res.headersSent) {
        res.send('Profile updated successfully.');
    }
    // next();
    // // Redirect the user after uploading the file
    // res.redirect("/profile");  
  } catch (error) {
      console.error('Error in file upload:', error);
      res.status(500).send('Internal Server Error');
  }
});


router.get('/feed', async function(req, res, next) {
  try {
      await client.connect();
      console.log('Connected to MongoDB');

      const db = client.db(dbName);
      const usersCollection = db.collection('users');

      const cursor = usersCollection.find({}, { projection: { _id: 1 } });
      const userIds = await cursor.toArray();

      // Fetch posts for each user
      for (const user of userIds) {
          const posts = await userModel.findOne({ _id: user._id }).populate("posts");
          if (posts && posts.posts) {
              userIds.push( posts.posts); 
              console.log(posts.posts)// Assuming the 'posts' field contains the actual posts
          }
      }

      res.render('feed', { userIds }); // Render the 'feed' view with userIds data

  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
  } finally {
      await client.close();
      console.log('Disconnected from MongoDB');
  }
});

// router.get('/feed',async function(req,res,next){
//   try {
//     await client.connect();
//     console.log('Connected to MongoDB');

//     const db = client.db(dbName);
//     const usersCollection = db.collection('users');

//     // // Fetch all users and populate user IDs in HTML
//     // const userIdsDiv = document.getElementById();
//     const cursor = usersCollection.find({}, { projection: { _id: 1 } });
//     var userIdsDiv =[] ;
//     await cursor.forEach(user => {
//         const userIdElement = user;
//         userIdElement.textContent = user._id;
//         var postss = userModel.findOne({
//           _id : user._id
//         }).populate("posts");
//         console.log(postss)
        
//          postss.forEach(post =>{
//          userIdsDiv.push(post);
//          });
//     });
//     res.render('feed' ,  {userIdsDiv , usersCollection});

// } catch (error) {
//     console.error('Error:', error);
// } finally {
//     // Close the connection
//     await client.close();
//     console.log('Disconnected from MongoDB');
// }
// });

router.get('/login',function(req,res){
  res.render('login',{title : 'Express'});
})



router.get('/profile', isLoggedIn ,async function(req,res,next){
  const user = await userModel.findOne({
    username : req.session.passport.user
  }).populate("posts");
  
  
  res.render('profile', {user});
});



router.get('/create', async function (req, res){
      const user =   await userModel.create ({
          username : 'omkar8',
          password : 'omkar8',
          email : 'omkar8@gmail.com',
          fullName : 'omkar8 raje'
          
        })
      
      res.send(user);   
          

});


router.post("/register",function(req,res){
  const {username , email , fullname } = req.body ;
  const userData = new userModel({ username , email  , fullname  });
  
    
  userModel.register(userData , req.body.password).then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/feed");
    })
  })
})


router.post("/login", passport.authenticate("local",{
  
     successRedirect : "/feed",
     failureRedirect : "/"
}),function(req,res){
      
});

router.get("/logout", function(req ,res){
  req.logout(function(err){
    if(err){
      return next(err);
    }
    res.redirect('/login');
  })
})

router.get("/",function(req,res){
  res.render('index');
})

function isLoggedIn(req,res,next){
      
  if(req.isAuthenticated()) return next();
  res.redirect("/");
}

module.exports = router;
