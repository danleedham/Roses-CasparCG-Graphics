var app = angular.module('StarterApp', ['ngRoute', 'LocalStorageModule', 'angularify.semantic', 'socket-io']);

app.controller('AppCtrl', ['$scope', '$location',
    function($scope, $location){
        $scope.menu = [];

        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };

        $scope.menu.push({
            name: 'General Top Right',
            url: '/topright',
            type: 'link',
            icon: 'violet list layout'
        });

        $scope.menu.push({
            name: 'Fixtures Bottom Right',
            url: '/bottomright',
            type: 'link',
            icon: 'teal grid layout',
        });

        $scope.menu.push({
            name: 'Moments Bottom Left',
            url: '/bottomleft',
            type: 'link',
            icon: 'yellow trophy',
        });

        $scope.menu.push({
            name: 'Ticker',
            url: '/ticker',
            type: 'link',
            icon: 'soccer',
        });

    }
]);

/*
 *  Configure the app routes
 */
app.config(['$routeProvider', 'localStorageServiceProvider',
    function($routeProvider, localStorageServiceProvider) {
        localStorageServiceProvider.setPrefix('la1tv');

        $routeProvider
            .when("/topright", {
                templateUrl: '/admin/templates/topRight.tmpl.html',
                controller: 'topRightCGController'
            })
            .when("/bottomright", {
                templateUrl: '/admin/templates/bottomRight.tmpl.html',
                controller: 'bottomRightCGController'
            })
            .when("/bottomleft", {
                templateUrl: '/admin/templates/bottomLeft.tmpl.html',
                controller: 'bottomLeftCGController'
            })
            .when("/ticker", {
                templateUrl: '/admin/templates/ticker.tmpl.html',
                controller: 'tickerCGController'
            })
            .otherwise({redirectTo: '/topright'});
    }
]);


app.controller('topRightCGController', ['$scope', 'socket',
    function($scope, socket){
        socket.on("topRight", function (msg) {
            $scope.topRight = msg;
        });

        $scope.$watch('topRight', function() {
            if ($scope.topRight) {
                socket.emit("topRight", $scope.topRight);
            } else {
                getTopRightData();
            }
        }, true);
        
        socket.on("topRight", function (msg) {
            $scope.topRight = msg;
        });
        
        function getTopRightData() {
            socket.emit("topRight:get");
        }
    }
]);

app.controller('bottomRightCGController', ['$scope', 'socket', '$http', 'localStorageService',
    function($scope, socket, $http, localStorageService) {
        socket.on("bottomRight", function (msg) {
            $scope.bottomRight = msg;
            if(msg.location == null){
                console.log("Nothing here, loading defaults");
                $scope.updateSelectables();
            } else {
                console.log("Something here: " + msg);
            }
        });

        $scope.$watch('bottomRight', function() {
            if ($scope.bottomRight) {
                // This will make the thing update live, which we don't want
                // socket.emit("bottomRight", $scope.bottomRight);
            } else {
                getbottomRightData();
            }
        }, true);
        
        socket.on("bottomRight", function (msg) {
            $scope.bottomRight = msg;
        });
        
        function getbottomRightData() {
            socket.emit("bottomRight:get");
        }
        
        $scope.applyImageOverride = function() {
            $scope.bottomRight.imageOveride = true;
            socket.emit('bottomRight:applyimage', $scope.bottomRight);
            //console.log('Apply Image');
            // console.log($scope.bottomRight); // debugging
        };
        
        $scope.hideImageOverride = function() {
            $scope.bottomRight.imageOveride = false;
            socket.emit('bottomRight:hideimage', $scope.bottomRight);
            // console.log('Hide Image'); 
            // console.log($scope.bottomRight)// debugging
        };
        
        $scope.locationChosen = function() {
            $scope.updateSelectables($scope.bottomRight.chosenLocation)
        }
        $scope.sportChosen = function() {
            $scope.updateSelectables($scope.bottomRight.chosenLocation,$scope.bottomRight.chosenSport)
        }
        $scope.groupChosen = function() {
            //console.log("Group Chosen");
        }
        $scope.broadcastChosen = function() {
            // console.log("Broadcast Chosen");
        }
        
        $scope.updateSelectables = function (location,sport,group,broadcast) {
            if(!location){
                console.log('Getting Selectable Values');
            }
            var fetchData = function () {
                var config = {headers:  {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                }
            };
            $http.get('/data/fixtures.json', config).then(function (response) {
						$scope.bottomRight.livebottomRight = response.data;   
				   	    
				   	    $scope.bottomRight.options = ["sport","group","points","location","time","broadcast","none"];
				   	    
				   	    // Sort out locations
				   	    if(!location || location == "All"){
                            var locations = Array(); 
                            for(var i = 0; i < $scope.bottomRight.livebottomRight.length; i++){
                                if(locations.indexOf($scope.bottomRight.livebottomRight[i].location) == -1){
                                    locations.push($scope.bottomRight.livebottomRight[i].location);
                                }
                            }
                            locations.sort();
                            locations.unshift("All");
                            $scope.bottomRight.locations = locations;
                            // console.log("Loading Locations");
                        }
				   	    if(!$scope.bottomRight.chosenLocation){
				   	        $scope.bottomRight.chosenLocation = "All";
				   	     }
				   	    
				   	    // Sort out Sports
				   	    if(!sport || sport == "All"){
                            var sports = Array();
                            for(var i = 0; i < $scope.bottomRight.livebottomRight.length; i++){
                                var oktopush = false;
                                if(location){
                                    if($scope.bottomRight.livebottomRight[i].location == location){
                                        var oktopush = true;
                                    }
                                } else { 
                                    var oktopush = true;
                                }
                                if(oktopush == true){
                                   if(sports.indexOf($scope.bottomRight.livebottomRight[i].sport) == -1){
                                        sports.push($scope.bottomRight.livebottomRight[i].sport);
                                    }
                                }
                            }
                            sports.sort();
                            sports.unshift("All");
                            $scope.bottomRight.sports = sports;
                            // console.log("Loading Sports");
                        }
                        if(!$scope.bottomRight.chosenSport){
                             $scope.bottomRight.chosenSport = "All";
                        }
                        
                        // Sort out Groups
                        var groups = Array(); 
                        for(var i = 0; i < $scope.bottomRight.livebottomRight.length; i++){ 
                           var oktopush = false;
                           if(location){
                                if($scope.bottomRight.livebottomRight[i].location == location){
                                    var oktopush = true;
                                }
                            } else { 
                                var oktopush = true;
                            }
                            if(sport){
                                if(!location || location == "All"){
                                    if($scope.bottomRight.livebottomRight[i].sport == sport){
                                        var oktopush = true;
                                    } else {
                                        var oktopush = false;
                                    }
                                } else {
                                    if(oktopush == true && $scope.bottomRight.livebottomRight[i].sport == sport){
                                        var oktopush = true;
                                    } else {
                                        var oktopush = false;
                                    }
                                }
                            }                             
                            if(oktopush == true){
                                if(groups.indexOf($scope.bottomRight.livebottomRight[i].group) == -1){
                                    groups.push($scope.bottomRight.livebottomRight[i].group);
                                }
                            }
                        }
                        groups.sort();
                        groups.unshift("All");
                        $scope.bottomRight.groups = groups;
                        $scope.bottomRight.chosenGroup = "All";
                        // console.log("Loading Groups");
                        var broadcasts = Array(); 
                        for(var i = 0; i < $scope.bottomRight.livebottomRight.length; i++){
                            if(broadcasts.indexOf($scope.bottomRight.livebottomRight[i].broadcast) == -1){
                                broadcasts.push($scope.bottomRight.livebottomRight[i].broadcast);
                            }
                        }
                        broadcasts.sort();
                        broadcasts.unshift("All");
                        $scope.bottomRight.broadcasts = broadcasts;
                        $scope.bottomRight.chosenBroadcast = "All";   
                        
					 });    
				};
				fetchData();	      				            
        }
    }
]);

app.controller('bottomLeftCGController', ['$scope', 'socket', 'localStorageService',
    function($scope, socket, localStorageService){
        
        // Grab current moments, first time it loads. 
        socket.emit("pleaseSendMoments");
        
        socket.on("bottomLeft", function (msg) {
            $scope.bottomLeft = msg;
            if(msg.grabThisMany == undefined){
                $scope.bottomLeft.grabThisMany = 10;
            }
        });

        $scope.$watch('bottomLeft', function() {
            if ($scope.bottomLeft) {
                // Automatically do stuff if the scope changes
                // socket.emit("bottomLeft", $scope.bottomLeft);
                // console.log($scope.bottomLeft);
            } else {
                getBottomLeftData();
            }
        }, true);
        
        function getBottomLeftData() {
            socket.emit("bottomLeft:get");
        }   
             
        socket.on('momentsUpdated', function(msg){
            $scope.moments = msg;
            // console.log('Moments have been updated');
            // console.log($scope.moments);
        });

        $scope.show = function(momentid) {
            socket.emit("bottomLeftOverride", momentid);
            console.log(momentid);
        };

        $scope.hideOverridden = function(){
            $scope.bottomLeft.momentOverride = false;
            socket.emit("bottomLeftOverride", "hide");
            console.log("Stopping Override")
        }

        $scope.removeMoment = function(momentid) {
            socket.emit("bottomLeftRemove", momentid);
            console.log("Removing " + momentid + " from list");
        };
        
        $scope.returnMoment = function(momentid) {
            socket.emit("bottomLeftReturn", momentid);
            console.log("Returning " + momentid + " to list");
        };

    }
]);

app.controller('tickerCGController', ['$scope', 'socket',
    function($scope, socket){
        socket.on("ticker", function (msg) {
            $scope.ticker = msg;
            if(msg.overrideHeader == undefined){
                $scope.ticker.overrideHeader = "Latest Scores";
            }
            if(msg.grabThisMany == undefined){
                $scope.ticker.grabThisMany = 10;
            }
        });

        $scope.setSettings = function() {
            socket.emit("ticker", $scope.ticker);
            console.log($scope.ticker);
        };

        $scope.$watch('ticker', function() {
            if ($scope.ticker) {
                // socket.emit("ticker", $scope.ticker);  // No autoupdating, thanks
            } else {
                getTickerData();
            }
        }, true);
        
        function getTickerData() {
            socket.emit("ticker:get");
        }
    }
]);