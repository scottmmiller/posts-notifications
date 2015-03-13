Pagination:

	>limit: req.query.limit || 10;
	>skip: req.query.skip || 0;












var Express = require("express");

var Mongoose = require("mongoose");

var App = Express();

app.get("/posts", function(req, res) {
	return res.json({success: true});
});

app.post("/posts", function(req, res) {

});

app.put("/posts/:id", function(req, res) {

});

app.delete("/posts/:id", function(req, res) {

});

App.listen(8081);