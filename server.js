var express 	= require('express'),
	http 		= require('http'),
	path		= require('path')
	Stopwatch 	= require('./models/stopwatch');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var topRight = {};
var bottomRight = {};
var bottomLeft = {};
var ticker = {};

//Clock Functions
var stopwatch = new Stopwatch();

stopwatch.on('tick:stopwatch', function(time) {
	io.sockets.emit("clock:tick", time);
});


io.on('connection', function(socket) {
	console.log("Client Socket Connected");

	/*
	 * 		Clock functions
	 */

	socket.on("clock:pause", function() {
		stopwatch.pause();
	});

	socket.on("clock:reset", function() {
		stopwatch.reset();
	});

	socket.on("clock:up", function() {
		stopwatch.countUp();
	});

	socket.on("clock:down", function() {
		stopwatch.countDown();
	});

	socket.on("clock:set", function(msg) {
		stopwatch.setValue(msg);
	});

    socket.on("clock:get", function() {
        io.sockets.emit("clock:tick", stopwatch.getTime());
    });

	/*
	 * 		General Functions
	 */

	socket.on("bug", function(msg) {
        bug = msg;
		io.sockets.emit("bug", msg);
	});

    socket.on("bug:get", function(msg) {
		io.sockets.emit("bug", bug);
	});

	/*
	 * 		Bottom Left Moments
	 */

	socket.on("bottomLeft", function(msg) {
        bottomLeft = msg;
		io.sockets.emit("bottomLeft", msg);
	});

    socket.on("bottomLeft:get", function(msg) {
		io.sockets.emit("bottomLeft", bottomLeft);
	});

	socket.on("bottomLeftOverride", function(msg) {
		io.sockets.emit("bottomLeftOverride", msg);
	});

	socket.on("bottomLeftRemove", function(msg) {
		io.sockets.emit("bottomLeftRemove", msg);
	});

	socket.on("bottomLeftReturn", function(msg) {
		io.sockets.emit("bottomLeftReturn", msg);
	});

	socket.on("momentsUpdated", function(msg){
		io.sockets.emit("momentsUpdated", msg);
	});

	socket.on("pleaseSendMoments", function(msg){
		io.sockets.emit("pleaseSendMoments", msg);
	});

	/*
	* 		Bottom Right Fixtures
	*/
	socket.on("bottomRight", function(msg) {
        bottomRight = msg;
		io.sockets.emit("bottomRight", msg);
	});

    socket.on("bottomRight:get", function(msg) {
		io.sockets.emit("bottomRight", bottomRight);
	});

	socket.on("bottomRight:applyimage", function(msg) {
		io.sockets.emit("bottomRight", msg);
	});

	socket.on("bottomRight:hideimage", function(msg) {
		io.sockets.emit("bottomRight", "hideimage");
	});

	socket.on("bottomRightLimitToChosen", function(msg) {
		io.sockets.emit("bottomRightLimitToChosen", msg);
	});

	socket.on("bottomRightshowAllFixtures", function(msg) {
		io.sockets.emit("bottomRightshowAllFixtures", msg);
	});

	/*
	* 		Ticker
	*/

	socket.on("ticker", function(msg) {
        ticker = msg;
		io.sockets.emit("ticker", msg);
	});

    socket.on("ticker:get", function(msg) {
		io.sockets.emit("ticker", ticker);
	});

});


//Serve the puplic dir
app.use(express.static(__dirname + "/public"));
app.use(express.static(path.dirname(require.resolve('dynamic-marquee'))));


server.listen(3001);
console.log("Now listening on port 3001. Go to http://127.0.0.1:3001/admin to control")