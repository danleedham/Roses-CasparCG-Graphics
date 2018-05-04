var app = angular.module('cgApp', ['ngAnimate', 'socket-io']);

// Top Right General Info
app.controller('topRightCtrl', ['$scope', '$timeout', 'socket', '$http', '$interval',
    function($scope, $timeout, socket, $http, $interval){
        $scope.yorkWidth = "50%";
        $scope.lancsWidth = "50%";
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


        // Get the bottom scores from Roses live every 30 seconds and update
        $scope.tickInterval = 30000;
        $scope.yorkWidth = "50%";
        $scope.lancsWidth = "50%";

        var fetchScore = function () {
          var config = {headers:  {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            }
          };

        $http.get('https://roseslive.co.uk/score.json', config)
            .success(function(data) {
                if(isNaN(data.york) || isNaN(data.lancs)){
                    console.log("Roses live is giving us nonsense");
                    $scope.yorkWidth = "0%";
                    $scope.lancsWidth = "0%";
                    return;
                };
                var yorkScore = data.york;
                $scope.yorkScore = yorkScore;
                var lancScore = data.lancs;
                $scope.lancsScore = lancScore;
                var totalScore = parseInt(yorkScore) + parseInt(lancScore);
                if(totalScore == 0){
                    $scope.yorkWidth = "50%";
                    $scope.lancsWidth = "50%";
                } else {
                    var yorkWidth = yorkScore / totalScore;
                    var lancsWidth = lancScore / totalScore;

                    yorkWidth = (parseFloat(yorkWidth)*100).toFixed(2);
                    $scope.yorkWidth = yorkWidth + "%";
                    $scope.lancsWidth = (100 - yorkWidth) + "%"; 
                }
            }
            );
        };

        //Intial score fetch
        fetchScore();
        // Start the timer
        $interval(fetchScore, $scope.tickInterval);
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

        // Function fired for limiting fixtures to user selected stuff
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
                
                $scope.bottomRight.limitToToday = msg.limitToToday;
                $scope.bottomRight.hideEventScores = msg.hideEventScores;
                if(msg.header !== ""){
                    $scope.bottomRight.header = msg.header;
                    $scope.bottomRight.showUserHeader = true;
                } else {
                    $scope.bottomRight.showUserHeader = false;
                }
                updateFixtures(location,sport,group,broadcast);
            }
        }, true);

        socket.on("bottomRightshowAllFixtures", function(msg){
            $scope.bottomRight.limitToToday = msg.limitToToday;
            $scope.bottomRight.hideEventScores = msg.hideEventScores;
            if(msg.header !== ""){
                $scope.bottomRight.header = msg.header;
                $scope.bottomRight.showUserHeader = true;
            } else {
                $scope.bottomRight.showUserHeader = false;
            }
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

            if($scope.bottomRight.limitToToday !== undefined || location !== undefined || sport !== undefined || group !== undefined || broadcast !== undefined || $scope.limitToToday == true){
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
                
                var todaysDate = new Date();
            
                Promise.all([$http.get('http://localhost:1337/api/v1/roses/results', config), $http.get('http://localhost:1337/api/v1/roses/timetable_entries', config)]).then(function(values) {
 
                    var scoresResponse = values[0];  
                    var response = values[1];  
                   
                    var daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                    if($scope.bottomRight.resultsFileUpdated == undefined){
                        $scope.bottomRight.resultsFileUpdated = "";
                    }
                    // Need to do a check here to see if the data has changed, if so then carry on cowboy. 
                    var resultsFileUpdated = JSON.stringify(scoresResponse);
                     
                    if(resultsFileUpdated !== $scope.bottomRight.resultsFileUpdated || $scope.bottomRight.overrideCheck == true) {
                        // console.log("Fixtures file updated");
                        $scope.bottomRight.resultsFileUpdated = resultsFileUpdated;
                        console.log("Results Updated");
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
                            buildArray["dateTime"] = dateTime;
                            buildArray["group"] = response.data[i].team.title;
                            buildArray["location"] = response.data[i].location.name;
                            buildArray["broadcast"] = response.data[i].la1tv_coverage_level;
                            buildArray["points"] = response.data[i].point.amount;
                            buildArray["bgcolor"] = "fixturesDraw";
                            buildArray["resultColor"] = "";

                            for(j=0; j<scoresResponse.data.length; j++){
                                if(scoresResponse.data[j].timetable_entry_id == response.data[i].id){
                                    buildArray["time"] = scoresResponse.data[j].lancs_score + "-" + scoresResponse.data[j].york_score;
                                    buildArray["day"] = scoresResponse.data[j].lancs_score + "-" + scoresResponse.data[j].york_score;
                                    if(scoresResponse.data[j].winner == "L"){
                                        buildArray["bgcolor"] = "teamLancsInverse";
                                    } else if (scoresResponse.data[j].winner == "Y"){
                                        buildArray["bgcolor"] = "teamYorkInverse";
                                    }
                                    if(scoresResponse.data[j].confirmed == "Y"){
                                        buildArray["resultColor"] = "confirmedResult";
                                    }
                                    break;
                                }
                            }
                            
                            if($scope.bottomRight.limitToToday == true && dateTime.setHours(0,0,0,0) !== todaysDate.setHours(0,0,0,0)){
                                var isValidDay = false;
                            } else {
                                var isValidDay = true;
                            }

                            if($scope.bottomRight.overrideCheck == true){
                                if((isValidDay == true) || ((buildArray["location"] == location || location == "All") && (buildArray["sport"] == sport || sport == "All" ) && (buildArray["group"] == group || group == "All") && (buildArray["broadcast"] == broadcast || broadcast == "All"))){
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
        var momentsCheckTickInterval = 63000; // Allow this to be set?
        var momentsSwapTickInterval = 10000;  // Allow this to be set?
        $scope.bottomLeft = { momentOverride: false, overrideHeader: "", overrideText:"", ignoreMoments: [] };        
        $scope.moments = {"rows":[], "momentsFileUpdated" : ""};
 
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
            fetchMoments();       
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

        socket.on("bottomLeftManualMoment", function (msg) {
            console.log(msg);
            if(msg == "hide"){
                $scope.bottomLeft.momentOverride = false;
                // console.log("Stopping Override");
            } else {
                $scope.bottomLeft.overrideHeader = msg.overrideHeader;
                $scope.bottomLeft.overrideText = $sce.trustAsHtml(msg.overrideText);
                $scope.bottomLeft.momentOverride = true;
            }
        });
        
        // Function for fetching and setting moments
        function fetchMoments() {
            //console.log("Fetching Moments");
            var config = {headers:  {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            };

          $http.get('https://roseslive.co.uk/feed.json', config).then(function(response) {
              if(isNaN(response.data[0].id) || isNaN(response.data[0].id)){
                console.log("Roses live is giving us nonsense");
                return;
              } else { 
                
                
                // Check to see if the file has updated
                // var momentsFileUpdated = new Date(response.headers('Last-Modified'));
                // if(momentsFileUpdated > $scope.moments.momentsFileUpdated){
                   
                if($scope.mostRecentMomentId !== response.data[0].id){
            
                    var mostRecentMomentId = response.data[0].id;
                    $scope.mostRecentMomentId = mostRecentMomentId;
                    // Sort Array so we're getting the most recent content 
                    response.data.sort(function(a, b){
                        var keyA = new Date(a.updated_at),
                            keyB = new Date(b.updated_at);
                        // Compare the 2 dates
                        if(keyA < keyB) return 1;
                        if(keyA > keyB) return -1;
                        return 0;
                    });
                   
                   var moments = {"rows" : [], "mostRecentMomentId" : mostRecentMomentId};                           
                    for(i=0; i<response.data.length; i++){
                        var buildArray = {};  
                        buildArray["id"] = response.data[i].id;
                        if(response.data[i].text !== null){
                            response.data[i].text = response.data[i].text.replace('<Strong>Lancs','<Strong class="teamLancs"> Lancs');
                            response.data[i].text = response.data[i].text.replace('<Strong>York','<Strong class="teamYork"> York');
                            if(response.data[i].text.length > 193){
                                response.data[i].text = response.data[i].text.substring(0, 190) + "...";
                            }
                        }
                        buildArray["text"] = response.data[i].text
                        buildArray["updated_at"] = response.data[i].updated_at;
                        buildArray["type"] = response.data[i].live_moment_type.name;
                        buildArray["author"] = response.data[i].author;
                        buildArray["team_name"] = response.data[i].team_name;
                        
                        if(Number.isInteger(parseFloat(response.data[i].score_game_lancs)) && Number.isInteger(parseFloat(response.data[i].score_game_york))){
                            buildArray["score_game_lancs"] = parseInt(response.data[i].score_game_lancs);
                            buildArray["score_game_york"]  = parseInt(response.data[i].score_game_york);
                        } else {
                            buildArray["score_game_lancs"]  = response.data[i].score_game_lancs;
                            buildArray["score_game_york"]  = response.data[i].score_game_york;
                        }
                            
                        
                        
                        // If this is to be ignored by user input, then say so
                        if($scope.bottomLeft.ignoreMoments.indexOf(buildArray["id"]) > -1){
                            buildArray["ignore"] = $scope.bottomLeft.ignoreMoments.indexOf(buildArray["id"]);
                        } else {
                            buildArray["ignore"] = "false";
                        }

                        // Method for ignoing moments by type 
                        if(buildArray["type"] !== "General Commentary" && buildArray["type"] !== "Image" && buildArray["type"] !== "Link" && buildArray["type"] !== "Kick Off"){
                            if(buildArray["type"] == "Goal" || buildArray["type"] == "Half Time" || buildArray["type"] == "Full Time" || buildArray["type"] == "Score Update"){
                                if(buildArray["text"] == "" || buildArray["text"] == null || buildArray["score_game_lancs"] == null){

                                } else {
                                    if(buildArray["type"] == "Goal"){
                                        buildArray["type"] = "Goal " + ' ' + buildArray["score_game_lancs"] + '-' + buildArray["score_game_york"];
                                        buildArray["text"] = buildArray["team_name"] + ' - ' + buildArray["text"];
                                    }  else if (buildArray["type"] == "Score Update" && buildArray["score_game_lancs"] !== null) {
                                        buildArray["text"] = buildArray["text"] + ' (' + buildArray["score_game_lancs"] + '-' + buildArray["score_game_york"] + ')';
                                    } else {
                                        buildArray["text"] = buildArray["team_name"] + ' - ' + buildArray["text"] + ' (' + buildArray["score_game_lancs"] + '-' + buildArray["score_game_york"] + ')';
                                    }
                                    moments.rows.push(buildArray);
                                }
                            } else {
                                moments.rows.push(buildArray);
                            }
                            
                        } 
                    }
                    
                    $scope.moments.rows = moments.rows;
                    $scope.moments.momentsFileUpdated = moments.momentsFileUpdated;
                    
                    socket.emit('momentsUpdated', moments);
                    
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
                        $scope.currentMomentId = $scope.moments.rows[0].id;
                        $interval(rotateMoments, momentsSwapTickInterval);
                        $scope.moments.MomentsAlreadyTicking = true;
                    } else {
                        // console.log("Already ticking");
                    }
                } else {
                    console.log("Latest Moment already scraped");
                }
                //} else {
                    //console.log("No new Moments");
                //}               
               
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
        
        function createMarquee() {
            function appendItem(immediate) {
                function buildSeperator() {
                    const $seperator = document.createElement('span');
                    $seperator.className = "marquee-seperator";
                    $seperator.innerHTML = "&nbsp";
                    return $seperator;
                };
                
                function buildHeader() {
                    var $header = document.createElement('span');
                    $header.className = "tickerHeader";
                    $header.innerText = $scope.ticker.header;
                    return $header;
                }
                
                var records = $scope.ticker.records;
                if (!records.length) {
                    return;
                }
                var limit = $scope.ticker.grabThisMany;
                var includeUnconfirmed = $scope.ticker.unconfirmedFixtures;
                var filteredRecords = records.filter(function(record) {
                    return includeUnconfirmed || record.confirmed === "Y";
                }).reverse().slice(0, limit);

                var nextIndex = immediate ? (filteredRecords.indexOf(lastRecord) + 1) % filteredRecords.length : 0;
                var record = lastRecord = filteredRecords[nextIndex];
                var timetableData = record.timetable_data;

                var $container = document.createElement('span');
                if (nextIndex === 0) {
                    $container.appendChild(buildHeader());
                } else {
                    $container.appendChild(buildSeperator());
                }

                var $winner = document.createElement('span');
                if (record.winner == "L"){
                    $winner.className = "teamLancsInverse";
                    $winner.innerText = "Lancs";
                } else {
                    $winner.className = "teamYorkInverse";
                    $winner.innerText = "York";
                }
                var $scoreEl = $("<span />");
                $scoreEl.append($("<span />").text(timetableData.team.sport.title + " " + timetableData.team.title + " "));
                $scoreEl.append($winner);
                $scoreEl.append($("<span />").text(" " + record.lancs_score + '-' +  record.york_score + " (" + record.points + "pts)"));
                $container.appendChild($scoreEl[0]);
            
                marquee.appendItem($container);
            }

            var $marquee = document.getElementById('marquee');
            var marquee = window.m = new dynamicMarquee.Marquee($marquee, { rate: -75 });
            var lastRecord = null;

            marquee.onItemRequired(function() { appendItem(true) });

            $scope.$watch('ticker', function() {
                if (marquee.isWaitingForItem()) {
                    appendItem(false);
                }
            }, true);
        }

        $scope.ticker = {records: [], recordsById: {}, grabThisMany: 10, unconfirmedFixtures: true, header: 'Latest Scores'};
        $scope.tickerCheckTickInterval = 10000;
        createMarquee();
        
        var fetchTickerScores = function () {
            var config = {headers:  {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                }
            };

            Promise.all([$http.get('http://localhost:1337/api/v1/roses/results', config), $http.get('http://localhost:1337/api/v1/roses/timetable_entries', config)]).then(function(values) {
 
                var response = values[0];  
                var timetable = values[1];  

                if(isNaN(response.data[0].id) || isNaN(response.data[0].id)){
                    console.log("Roses live is giving us nonsense. Typical.");
                    return;
                } else {    

                    // Sort Array so it's in time ascending order
                    response.data.sort(function(a, b){
                        var keyA = new Date(a.updated_at),
                            keyB = new Date(b.updated_at);
                        // Compare the 2 dates
                        if(keyA < keyB) return -1;
                        if(keyA > keyB) return 1;
                        return 0;
                    });

                    var records = $scope.ticker.records;
                    var recordsById = $scope.ticker.recordsById;

                    response.data.forEach(function(responseItem) {
                        var timetableData = null;
                        timetable.data.some(function(entry) {
                            if (entry.id == responseItem.timetable_entry_id) {
                                timetableData = entry;
                                return true;
                            }
                            return false;
                        });
                        if (!timetableData) {
                            // console.error('Missing timetable data', responseItem);
                            return;
                        }

                        var newRecord = {
                            id: responseItem.id,
                            lancs_score: responseItem.lancs_score,
                            york_score: responseItem.york_score,
                            winner: responseItem.winner,
                            timetable_entry_id: responseItem.timetable_entry_id,
                            confirmed: responseItem.confirmed,
                            points: parseInt(responseItem.lancs_points) + parseInt(responseItem.york_points),
                            timetable_data: timetableData,
                            updated_at: responseItem.updated_at 
                        };
                        
                        if (recordsById[responseItem.id]) {
                            // update existing item. not replacing object because this would change reference and
                            // break marquee tracking
                            Object.assign(recordsById[responseItem.id], newRecord);
                        } else {
                            // new item
                            records.push(newRecord);
                            recordsById[responseItem.id] = newRecord;
                        }
                    });  
                }
            });
        };

        socket.on("ticker", function (msg) {
            $scope.ticker.grabThisMany = msg.grabThisMany || 10;
            $scope.ticker.header = msg.overrideHeader || 'Latest Scores';
            $scope.ticker.unconfirmedFixtures = typeof msg.unconfirmedFixtures === 'boolean' ? msg.unconfirmedFixtures : true;
            fetchTickerScores();
        });
        
        // start
        socket.emit("ticker:get");

        // Start the timer
        $interval(fetchTickerScores, $scope.tickerCheckTickInterval);
    }
]);