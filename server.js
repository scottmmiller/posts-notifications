var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Post = require('./models/Post');
var User = require('./models/User');
var q = require('q');
var multer = require('multer');
var fs = require('fs');
var AWS = require('aws-sdk');
var mime = require('mime');

//since we use these vars multiple times, store them here
var aws_region = 'us-west-1';
var aws_bucket_name = 'posts-notifs';

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: aws_region
});

console.log(process.env.AWS_ACCESS_KEY)
console.log(process.env.AWS_SECRET_KEY)

var app = express();
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(multer({dest: './uploads/'}))

mongoose.connect('mongodb://localhost/post-notifs');

app.get('/posts', function(req, res) {

	//pagination
	var limit = req.query.limit || 10;
	var skip = req.query.skip || 0;

	//we'll warp the count call in a promise (that way, we can parallelize it with the Post find)
	var countFunction = function() {
		var deferred = q.defer();
		Post.count(function(err, count) {
			deferred.resolve(count);
		});
		return deferred.promise;
	};

	//call both these promises in parallel, (counting and finding)
	q.all([
		countFunction(),
		Post
			.find()
			.limit(limit)
			.skip(skip)
			.sort('-createdAt')
			.exec()
		]).spread(function(count, posts) {
			return res.json({
				posts: posts,
				total_posts: count
			});
	});

	//simpler version of just finding (without count)
	// Post
	// 	.find()
	// 	.limit(limit)
	// 	.skip(skip)
	// 	.sort('-createdAt')
	// 	.exec()
	// ]).spread(function(count, posts) {
	// 	return res.json(posts);
	// });
});

app.post('/posts', function(req, res) {
	var post = new Post(req.body);
	post.save(function(err, newPost) {
		return res.json(newPost);
	});
});
app.put('/posts/:id', function(req, res) {
	//inspect the body to see which fields they're trying to change
	//if (req.body.user) {
	//	delete req.body.user;		
	//}

	//this will ensure that each time the post's updatedAt prop gets updated
	req.body.updatedAt = Date.now();
	Post.findOneAndUpdate({_id: req.params.id}, req.body, function(err, post) {

		//if you don't "return," you can keep doing things
		res.json(post);

		//notify user
		var user = User.findOne({_id: post.user}).exec().then(function(user) {
			user.notifications.push({
				body: "Post \""+post.title+"\" has been updated!!"
			});
			user.save(function(err) {
				console.log("user was saved!");
			});
		});
	});

	// Post.findOne({_id: req.params.id}).exec().then(function(post) {
	// 	var history = {
	// 		title: post.title,
	// 		body: post.body
	// 	};
	// 	post.history.push(history);
	// 	post.title = req.body.title;
	// 	post.body = req.body.body;
	// 	//
	// 	post.save(function(err) {
	// 		return res.json(post);
	// 	})
	// });
});
app.delete('/posts/:id', function(req, res) {
	Post.remove({_id: req.params.id}, function(err) {
		if (err) {
			//console.log
			return res.status(500).end({message: "Problem: post not deleted."});
		}
		return res.status(200).end();
	});
});

app.post('/users', function(req, res) {
	var user = new User(req.body);
	user.save(function(err, newUser) {
		return res.json(newUser);
	});
});

app.get('/users/:id', function(req, res) {
	User.findOne({_id: req.params.id}).exec().then(function(user) {
		//make file path convenient for client (they don't have to know wich CDN we're using)
		user.profile_picture = 'https://s3-'+aws_region+'.amazonaws.com/'+aws_bucket_name+'/'+user.profile_picture;
		return res.json(user);
	});
});

app.post('/users/:id/photo', function(req, res) {
	var photo = req.files.photo;
	//if you want to upload to S3
	var s3bucket = new AWS.S3();
	var amazon_filename = req.params.id+'.'+photo.extension;
	fs.readFile(photo.path, function(err, file_buffer){
	    var params = {
	        Bucket: aws_bucket_name,
	        Key: amazon_filename,
	        Body: file_buffer,
    		ACL: 'public-read', //this makes it public by default
	        ContentType: mime.lookup(photo.path)
	    };
	    s3bucket.putObject(params, function (perr, pres) {
	    	//once uploaded, url will look like:
	    	//https://s3-us-west-1.amazonaws.com/posts-notifs/5500a3c7b019154d5b1d0418.JPG
	        if (perr) {
	            console.log("Error uploading data: ", perr);
	        } else {
	            console.log("Successfully uploaded data to myBucket/myKey");
	        }
	        User.findOneAndUpdate({_id: req.params.id}, {
	        	profile_picture: amazon_filename
	        }, function(err) {
				return res.status(200).end();
	        });
	    });
	});
	//if you want to upload locally (to your server)
	// fs.rename(photo.path, './public/user-profile-images/'+req.params.id+'.'+photo.extension, function() {
	// 	return res.status(200).end();
	// });
});

app.listen(8081);