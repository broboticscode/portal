var twist;
var cmdVel;
var publishImmidiately = true;
var robot_IP;
var manager;
var teleop;
var ros;


function initMap() {
  var myLatLng = {lat: -25.363, lng: 131.044};

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: myLatLng
  });

  var marker = new google.maps.Marker({
    position: myLatLng,
    map: map,
    title: 'Hello World!'
  });
}

function fixListener(){

  var listener = new ROSLIB.Topic({
    ros : ros,
    name : '/fix',
    messageType : 'sensor_msgs/NavSatFix'
  });

  // var listener = new ROSLIB.Topic({
  //   ros : ros,
  //   name : '/listener',
  //   messageType : 'std_msgs/String'
  // });
//use this to test
  //rostopic pub /listener std_msgs/String "Hello, World" -r 10

  listener.subscribe(function(message) {
    console.log('Received latitude ' + listener.name + ': ' + message.latitude);
    console.log('Received longitude ' + listener.name + ': ' + message.longitude);


    console.log('Received type ' + typeof(message));
  //  listener.unsubscribe();
  });
}

function connect(){
  // determine robot address automatically
  // robot_IP = location.hostname;
  // set robot address statically
  robot_IP = "127.0.0.1";

  // // Init handle for rosbridge_websocket
  ros = new ROSLIB.Ros({
      url: "ws://" + robot_IP + ":9090"
  });
    ros.on('connection', function() {
     console.log('Connected to websocket server.');
  });
    ros.on('error', function(error) {
   console.log('Error connecting to websocket server: ', error);
  });

    ros.on('close', function() {
   console.log('Connection to websocket server closed.');
  });

}

window.onload = function () {
  connect();
  fixListener();
}
