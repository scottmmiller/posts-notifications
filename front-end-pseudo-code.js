//pseudo code for controller
angular.module('MyApp').controller('postsController', function($scope, PostsService) {
	
	$scope.limit = 10;
	$scope.skip = 0;

	$scope.loadPosts = function() {
		PostsService.getPosts($scope.limit, $scope.skip).then(function(posts) {
			$scope.posts = posts;
		});
	};

	$scope.nextPage = function() {
		if ($scope.posts.length < $scope.limit) {
			return;
		}
		$scope.skip += $scope.limit;
		$scope.loadPosts();
	}
	$scope.prevPage = function() {
		if ($scope.skip <= 0) {
			return;
		}
		$scope.skip -= $scope.limit;
		$scope.loadPosts();
	}

	$scope.removePost = function(postId) {
		PostsService.removePost(postId).then(function() {
			//remove item from array
			//splice
			//or reload page
			//$scope.loadPosts();
		})
	}

});

//PostsService
this.getPosts = function(limit, skip) {
	var deferred = $q.defer();
	$http({
		method: 'GET',
		url: '/posts?limit='+limit+'&skip='+skip
	}).then(function(response) {
		deferred.resolve(response.data)
	});
	return deferred.promise;
}

this.removePost = function(postId) {
	var deferred = $q.defer();
	$http({
		method: 'DELETE',
		url: '/posts/'+postId
	}).then(function(response) {
		deferred.resolve(response.data)
	});
	return deferred.promise;
}