var app = angular.module('cgApp', ['ngAnimate', 'socket-io']);

// Top Right General Info
app.controller('topRightCtrl', ['$scope', '$timeout', 'socket',
    function($scope, $timeout, socket){
        $scope.tickInterval = 1000; //ms
        socket.on("topRight", function (msg) {
            $scope.topRight = msg;
        });
        
        var tick = function () {
            $scope.clock = Date.now(); // get the current time
            $timeout(tick, $scope.tickInterval); // reset the timer
        };
        
        // Start the timer
        $timeout(tick, $scope.tickInterval);
        tick();
    }
]);

// Bottom Right Fixtures
app.controller('bottomRightCtrl', ['$scope', '$interval', '$http', 'socket',
    function($scope, $interval, $http, socket){
        $scope.fixturesTickInterval = 300000; //ms
        $scope.fixturesOnScreen = 10000; //ms    
        if($scope.bottomRight == undefined){
            $scope.bottomRight = [];
        }
                
        /* socket.on("bottomRight", function (msg) {
            $scope.bottomRight = msg;
        }, true); */

        socket.on("bottomRightLimitToChosen", function(msg){
            if (msg !== undefined) {
                if(msg.chosenLocation) {
                    var location = msg.chosenLocation;
                    $scope.bottomRight.chosenLocation = msg.chosenLocation;
                } else {
                    var location = "";
                }
                if(msg.chosenSport) {
                    var sport = msg.chosenSport;
                    $scope.bottomRight.chosenSport = msg.chosenSport;
                } else {
                    var sport = "";
                }if(msg.chosenGroup) {
                    var group = msg.chosenGroup;
                    $scope.bottomRight.chosenGroup = msg.chosenGroup;
                } else {
                    var group = "";
                }if(msg.chosenBroadcast) {
                    var broadcast = msg.chosenBroadcast;
                    $scope.bottomRight.chosenBroadcast = msg.chosenBroadcast;
                } else {
                    var boardcast = "";
                }

                updateFixtures(location,sport,group,broadcast);
            }
        }, true);

        socket.on("bottomRightshowAllFixtures", function(){
            updateFixtures();
        }, true);
           
        var updateFixtures = function(location,sport,group,broadcast) {
            if($scope.bottomRight.chosenLocation !== "" && location == undefined){
                location = $scope.bottomRight.chosenLocation;
            } else {
                location = undefined;
            }
            if($scope.bottomRight.chosenSport !== "" && sport == undefined){
                sport = $scope.bottomRight.chosenSport;
            }  else {
                sport = undefined;
            }
            if($scope.bottomRight.chosenGroup !== "" && group == undefined){
                group = $scope.bottomRight.chosenGroup;
            } else {
                group = undefined;
            }
            if($scope.bottomRight.chosenBroadcast !== "" && broadcast == undefined){
                broadcast = $scope.bottomRight.chosenBroadcast;
            }  else {
                broadcast = undefined;
            }

            if(location !== undefined || sport !== undefined || group !== undefined || broadcast !== undefined){
                $scope.bottomRight.overrideCheck = true; 
            } else {
                $scope.bottomRight.overrideCheck = false;
            }

            var fetchData = function () {
                var config = { headers:  {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                }
            };
            
            $http.get('/data/timetable_entries_example.json', config).then(function (response) {
                   
                    var daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                    if($scope.bottomRight.fixturesFileUpdated == undefined){
                        $scope.bottomRight.fixturesFileUpdated = new Date("01/01/1970");
                    }
                    // Need to do a check here to see if the data has changed, if so then carry on cowboy. 
                    var fixturesFileUpdated = new Date(response.headers('Last-Modified'));
                                        
                    if(fixturesFileUpdated > $scope.bottomRight.fixturesFileUpdated || $scope.bottomRight.overrideCheck == true) {
                        console.log("Fixtures file updated");
                        $scope.bottomRight.fixturesFileUpdated = fixturesFileUpdated;
                        var newLivebottomRight = {"rows" : []}; 
                    
                        for(var i = 0; i < response.data.length; i++){
                            var buildArray = {};  
                            
                            dateTimeString = response.data[i].start;
                            dateTime = new Date(dateTimeString);
                              var day = daysOfWeek[dateTime.getDay()];
                              var hours = dateTime.getHours();
                              var minutes = dateTime.getMinutes();
                              // var ampm = hours >= 12 ? 'pm' : 'am';
                              // hours = hours % 12;
                              // hours = hours ? hours : 12; // the hour '0' should be '12'
                              hours = hours < 10 ? '0'+hours : hours;
                              minutes = minutes < 10 ? '0'+minutes : minutes;
                              var strTime = '' + hours + ':' + minutes;
                            response.data[i].time = strTime;                     
                        
                            buildArray["id"] = response.data[i].id;
                            buildArray["sport"] = response.data[i].team.sport.title;
                            buildArray["time"] = strTime; 
                            buildArray["day"] = day;
                            buildArray["group"] = response.data[i].team.title;
                            buildArray["location"] = response.data[i].location.name;
                            buildArray["broadcast"] = response.data[i].la1tv_coverage_level;
                            buildArray["points"] = response.data[i].point.amount;

                            if($scope.bottomRight.overrideCheck == true){
                                if((buildArray["location"] == location || location == "All") && (buildArray["sport"] == sport || sport == "All" ) && (buildArray["group"] == group || group == "All") && (buildArray["broadcast"] == broadcast || broadcast == "All")){
                                    newLivebottomRight["rows"].push(buildArray);    
                                }
                            } else {
                                newLivebottomRight["rows"].push(buildArray);
                            }
                        }                            

                        if($scope.bottomRight.currentSport == undefined){
                            $scope.bottomRight.currentSport = newLivebottomRight["rows"][0].sport;
                        }
                        $scope.bottomRight.rows = newLivebottomRight["rows"];                 
                        // console.log($scope.bottomRight);
                        
                        if($scope.bottomRight.overrideCheck == true){
                            changeSport();
                        }

                        // Change the sports every so often
                        if($scope.bottomRight.currentSportSwitching !== true) {
                            $interval(changeSport,$scope.fixturesOnScreen);
                            // console.log('Starting the cycle');
                        } else {
                            // console.log('Cycle already peddling');
                        }
                    } else {
                        console.log("Fixtures file hasn't changed");
                    }

                 });    
            };
            
            fetchData();	         		     						
        };
        
        // Function that cycles fixtures sports. 
        var changeSport = function(){
            var i = 0;
            if($scope.bottomRight.rows !== undefined){
            
                // Make a unique sports array
                
                var allSports = [];
                for(j=0; j < $scope.bottomRight.rows.length; j++){
                    allSports.push($scope.bottomRight.rows[j].sport);
                }
                uniqueSports = [...new Set(allSports)];
                if($scope.bottomRight.currenti == undefined){
                    $scope.bottomRight.currenti = uniqueSports.findIndex(function(element){ return element == $scope.bottomRight.currentSport});
                }

                if($scope.bottomRight.currenti !== undefined){ 
                   $scope.bottomRight.currenti = $scope.bottomRight.currenti+1;
                   if($scope.bottomRight.currenti >= uniqueSports.length) {
                    $scope.bottomRight.currenti = 0;
                   }
                } else {
                    $scope.bottomRight.currenti = 0;
                }
            
                $scope.bottomRight.currentSport = uniqueSports[$scope.bottomRight.currenti];
                // console.log('Chosen Sport = '+ $scope.bottomRight.currentSport);
                $scope.bottomRight.currentSportSwitching = true;
            } else {
                // console.log('No sport changes');
            }
        }

        // First fetch plz
        updateFixtures();
        
        // Start the timer to update fixtures
        $interval(updateFixtures, $scope.fixturesTickInterval);       
        
    }    
]);

// Bottom Left Moments
app.controller('bottomLeftCtrl', ['$scope', '$interval', '$http', 'socket', '$sce',
    function($scope, $interval, $http, socket, $sce){
        var momentsCheckTickInterval = 63000; // Allow this to be set
        var momentsSwapTickInterval = 6000;  // Allow this to be set 
        $scope.bottomLeft = { momentOverride: false, overrideHeader: "", overrideText:"", ignoreMoments: [] };        
        $scope.moments = {"rows":[]};
        $scope.latestMomentId = "";
 
        socket.on("pleaseSendMoments", function(){
            if($scope.moments !== undefined){
                socket.emit('momentsUpdated', $scope.moments);
            } else {
                socket.emit('momentsUpdated',"No Moments Sorry");
            }
        });
        
        socket.on("bottomLeftRemove", function (momentid) {
            if(momentid !== undefined){
                if($scope.bottomLeft.ignoreMoments == undefined){
                    $scope.bottomLeft.ignoreMoments = [momentid];
                } else {
                    if($scope.bottomLeft.ignoreMoments.indexOf(momentid) == -1 ){
                        $scope.bottomLeft.ignoreMoments.push(momentid);
                    }
                }
            }
            console.log($scope.bottomLeft.ignoreMoments);
            $scope.fetchMoments();       
        });

        socket.on("bottomLeftReturn", function (momentid) {
            if(momentid !== undefined){
                if($scope.bottomLeft.ignoreMoments == undefined){
                    $scope.bottomLeft.ignoreMoments = [];
                } else {
                    var index = $scope.bottomLeft.ignoreMoments.indexOf(momentid);
                    if (index > -1) {
                        $scope.bottomLeft.ignoreMoments.splice(index, 1);
                    }
                }
            }
            // console.log($scope.bottomLeft.ignoreMoments);  

        });

        socket.on("bottomLeftOverride", function (momentid) {
            if(momentid == "hide"){
                $scope.bottomLeft.momentOverride = false;
                // console.log("Stopping Override");
            } else {
                $scope.bottomLeft.momentOverride = true;
                $scope.bottomLeft.overrideid = momentid;
                for(i=0; i < $scope.moments.rows.length; i++){
                    if($scope.moments.rows[i].id == momentid){
                        $scope.bottomLeft.overrideHeader = $scope.moments.rows[i].header;
                        $scope.bottomLeft.overrideText = $scope.moments.rows[i].content;
                        break;
                    }
                }
            }
        });
        
        function fetchMoments() {
            // console.log("Fetching Moments");
            var config = {headers:  {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            };

          $http.get('data/feed_example.json', config).then(function(response) {
              if(isNaN(response.data[0].id) || isNaN(response.data[0].id)){
                console.log("Roses live is giving us nonsense");
                return;
              } else { 
                 
                 // Sort Array so we're getting the most recent content 
                 response.data.sort(function(a, b){
                    var keyA = new Date(a.updated_at),
                        keyB = new Date(b.updated_at);
                    // Compare the 2 dates
                    if(keyA < keyB) return -1;
                    if(keyA > keyB) return 1;
                    return 0;
                });
                
                var momentsFileUpdated = new Date(response.headers('Last-Modified'));
                // Check the latest moment's ID
                if($scope.latestMomentId !== response.data[0].id){
                    $scope.latestMomentId = response.data[0].id;
                    var moments = {"rows" : [], "momentsFileUpdated" : momentsFileUpdated};                           
                    for(i=0; i<response.data.length; i++){
                        var buildArray = {};  
                        buildArray["id"] = response.data[i].id;
                        response.data[i].text = response.data[i].text.replace('<Strong>Lancs','<Strong class="teamLancs"> Lancs');
                        response.data[i].text = response.data[i].text.replace('<Strong>York','<Strong class="teamYork"> York');
                        buildArray["text"] = response.data[i].text
                        buildArray["updated_at"] = response.data[i].updated_at;
                        buildArray["type"] = response.data[i].live_moment_type.name;
                        buildArray["author"] = response.data[i].author;
                        buildArray["team_name"] = response.data[i].team_name;
                        
                        // Grab Twitter Image
                        if(response.data[i].picture_file !== ""){
                            buildArray["picture_file"] = response.data[i].picture_file;
                        } else {
                            buildArray["picture_file"] = "";
                        }
                        
                        // If this is to be ignored by user input, then say so
                        if($scope.bottomLeft.ignoreMoments.indexOf(buildArray["id"]) > -1){
                            buildArray["ignore"] = $scope.bottomLeft.ignoreMoments.indexOf(buildArray["id"]);
                        } else {
                            buildArray["ignore"] = "false";
                        }

                        // Method for ignoing moments by type 
                        if(buildArray["type"] !== "General Commentary" ){
                            moments.rows.push(buildArray);
                        } 
                    }
                    
                    $scope.moments.rows = moments.rows;
                    $scope.moments.momentsFileUpdated = moments.momentsFileUpdated;
                    
                    socket.emit('momentsUpdated', moments);
                    
                    $scope.latestMomentId = moments.rows[0].id;
                    
                    for(i=0; i<moments.rows.length; i++){
                        // Here we add any moment type specific info
                        if(moments.rows[i].type == "Tweet"){
                            $scope.moments.rows[i].header = moments.rows[i].author;
                            if(moments.rows[i].text.indexOf('https://t.co/') > -1){
                                var text = moments.rows[i].text.substr(0, moments.rows[i].text.indexOf('https://t.co/'));
                                $scope.moments.rows[i].content = $sce.trustAsHtml(text);
                            } else {
                                $scope.moments.rows[i].content = $sce.trustAsHtml(moments.rows[i].text);
                            }
                            
                        } else  if (moments.rows[i].type == "Score Update"){
                            var team = moments.rows[i].text.substr(0, moments.rows[i].text.indexOf(',')); 
                            $scope.moments.rows[i].header = team;
                            $scope.moments.rows[i].content = $sce.trustAsHtml(moments.rows[i].text);
                            $scope.moments.rows[i].header = moments.rows[i].type;
                            $scope.moments.rows[i].content = $sce.trustAsHtml(moments.rows[i].text);
                        } else {
                            $scope.moments.rows[i].header = moments.rows[i].type;
                            $scope.moments.rows[i].content = $sce.trustAsHtml(moments.rows[i].text);
                        }                   
                    }
                
                    //console.log($scope.moments);
                    if($scope.moments.MomentsAlreadyTicking == undefined){
                        $interval(rotateMoments, momentsSwapTickInterval);
                        $scope.moments.MomentsAlreadyTicking = true;
                    } else {
                        // console.log("Already ticking");
                    }

                } else {
                    //console.log("No new Moments");
                }               
               
              }              
        
            }
          );
        };   
        
        // Function for rotating moments. Output is a change in $scope.currentMomentId every second.
        function rotateMoments(){
            var currenti = 0;
            if($scope.moments.rows.length > 0){
                if($scope.currentMomentId  == undefined){
                    $scope.currentMomentId = $scope.moments.rows[0].id;
                    // console.log("Setting first moment");
                } else {
                    for(i=0; i<$scope.moments.rows.length; i++){
                        if($scope.moments.rows[i].id == $scope.currentMomentId){
                            currenti = i + 1;
                            if(currenti == $scope.moments.rows.length){
                                currenti = 0;
                            }
                        }
                    }
                    $scope.currentMomentId = $scope.moments.rows[currenti].id;
                    // console.log($scope.currentMomentId);  
                }
            } 
        }       
        
        // First fetch if moments rows array is empty
        if($scope.moments.rows.length == 0){
            fetchMoments();
        } else {
            // console.log($scope.moments);
        }
        // Start the timer for subsiquent grabs.
        $interval(fetchMoments, momentsCheckTickInterval); 
        
    }
]);

// Ticker Things
app.controller('tickerCtrl', ['$scope', '$interval', '$http', 'socket', '$sce',
    function($scope, $interval, $http, socket, $sce){
        var $seperatorBuilder = function() {
            const $seperator = document.createElement('span');
            $seperator.className = "marquee-seperator";
            $seperator.innerHTML = "&nbsp";
            return $seperator;
        };
        function createMarquee() {
            var $marquee = document.getElementById('marquee');
            var marquee = window.m = new dynamicMarquee.Marquee($marquee, { rate: -75 });
            return dynamicMarquee.loop(marquee);
        }

        $scope.ticker = {$rowBuilders:[], grabThisMany: 10, unconfirmedFixtures: true};
        $scope.tickerCheckTickInterval = 10000;
        var control = createMarquee();
        
        function updateMarquee() {
            // TODO use $.watch
            items = [
                function() {
                    var $header = document.createElement('span');
                    $header.className = "tickerHeader";
                    $header.innerText = $scope.ticker.tickerHeader;
                    return $header;
                }
            ];
            $scope.ticker.$rowBuilders.forEach(function($builder, i) {
                items.push(function() {
                    var $container = document.createElement('span');
                    if (i > 0) {
                        $container.appendChild($seperatorBuilder());
                    }
                    $container.appendChild($builder());
                    return $container;
                });
            });
            control.update(items);
        }
        
        var fetchTickerScores = function () {
            var config = {headers:  {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                }
            };

            Promise.all([$http.get('data/results_example.json', config), $http.get('data/timetable_entries_example.json', config)]).then(function(values) {
 
                var response = values[0];  
                var timetable = values[1];  

                if(isNaN(response.data[0].id) || isNaN(response.data[0].id)){
                    console.log("Roses live is giving us nonsense. Typical.");
                    return;
                } else { 
                 
                    var tickerFileUpdated = new Date(response.headers('Last-Modified'));      

                    // Only do anything if the file has bene updated since we last updated it
                    if(!$scope.ticker.tickerFileUpdated || tickerFileUpdated >= $scope.ticker.tickerFileUpdated) {
                        $scope.ticker.tickerFileUpdated = tickerFileUpdated;
                        // Sort Array so we're getting the most recent content       
                        response.data.sort(function(a, b){
                            var keyA = new Date(a.updated_at),
                                keyB = new Date(b.updated_at);
                            // Compare the 2 dates
                            if(keyA < keyB) return -1;
                            if(keyA > keyB) return 1;
                            return 0;
                        });

                        var rows = [];
                        response.data.forEach(function(responseItem) {
                            // Choose whether or not to display unconfirmed fixtures
                            if($scope.ticker.unconfirmedFixtures || responseItem.confirmed === "Y") {
                                var timetableData = null;
                                timetable.data.some(function(entry) {
                                    if (entry.id == responseItem.timetable_entry_id) {
                                        timetableData = entry;
                                        return true;
                                    }
                                    return false;
                                });
                                if (!timetableData) {
                                    console.error('Missing timetable data', responseItem);
                                    return;
                                }
                                rows.push({
                                    id: responseItem.id,
                                    lancs_score: responseItem.lancs_score,
                                    york_score: responseItem.york_score,
                                    winner: responseItem.winner,
                                    timetable_entry_id: responseItem.timetable_entry_id,
                                    confirmed: responseItem.confirmed,
                                    points: parseInt(responseItem.lancs_points) + parseInt(responseItem.york_points),
                                    timetable_data: timetableData 
                                });
                            }
                        });

                        // The ticker header is to be displayed ahead of the scores, like 'Breaking News'
                        $scope.ticker.tickerHeader = $scope.ticker.overrideHeader || "Latest Scores";
                        $scope.ticker.$rowBuilders = rows.slice(0, $scope.ticker.grabThisMany).map(function(row) {
                            var timetableData = row.timetable_data;
                            var $builder = function() {
                                var $winner = document.createElement('span');
                                if (row.winner == "L"){
                                    $winner.className = "teamLancsInverse";
                                    $winner.innerText = "Lancs";
                                } else {
                                    $winner.className = "teamYorkInverse";
                                    $winner.innerText = "York";
                                }

                                var $scoreEl = $("<span />");
                                $scoreEl.append($("<span />").text(timetableData.team.sport.title + " " + timetableData.team.title + " "));
                                $scoreEl.append($winner);
                                $scoreEl.append($("<span />").text(" " + row.lancs_score + '-' +  row.york_score + " (" + row.points + "pts)"));
                                return $scoreEl[0];
                            }
                            return $builder;
                        });
                        // console.log($scope.ticker.$rowBuilders);
                        updateMarquee();
                        
                    } else {
                        //console.log("The scores file hasn't changed since we last did anything");
                    }                             
                }              
                }
          );
        };

        socket.on("ticker", function (msg) {
            $scope.ticker.grabThisMany = msg.grabThisMany;
            $scope.ticker.overrideHeader = msg.overrideHeader;
            $scope.ticker.unconfirmedFixtures = msg.unconfirmedFixtures;
            fetchTickerScores();
        });
        
        // start
        socket.emit("ticker:get");

        // Start the timer
        $interval(fetchTickerScores, $scope.tickerCheckTickInterval);
    }
]);