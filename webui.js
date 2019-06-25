/* Webui.js

This JS file handles all of the functionality present in the index.html file

webui supports the portal homepage in:
  -displaying live robot video
  -providing a virtual joystick to control the robot
  -providing a


*/
var twist;
var cmdVel;
var publishImmidiately = true;
var robot_IP;
var manager;
var teleop;
var ros;


function moveAction(linear, angular) {
    if (linear !== undefined && angular !== undefined) {
        twist.linear.x = linear;
        twist.angular.z = angular;
    } else {
        twist.linear.x = 0;
        twist.angular.z = 0;
    }
    cmdVel.publish(twist);
}

//Create a publisher on cmd_vel topic to publish Twist messages
function initVelocityPublisher() {
    // Init message with zero values.
    twist = new ROSLIB.Message({
        linear: {
            x: 0,
            y: 0,
            z: 0
        },
        angular: {
            x: 0,
            y: 0,
            z: 0
        }
    });
    //Init topic object to publish Twist messages on cmd_vel
    cmdVel = new ROSLIB.Topic({
        ros: ros,
        name: '/turtle1/cmd_vel',
        messageType: 'geometry_msgs/Twist'
    });
    // Register publisher within ROS system
    cmdVel.advertise();
}

//Initialise the keyboard and use robot webtools keyboard teleop package to send cmd_vel messages
function initTeleopKeyboard() {
    // Use w, s, a, d keys to drive your robot

    // Check if keyboard controller was aready created
    if (teleop == null) {
        // Initialize the teleop.
        teleop = new KEYBOARDTELEOP.Teleop({
            ros: ros,
            topic: '/turtle1/cmd_vel'
        });
    }

    // Add event listener for slider moves and modify the speed of the robot accordingly
    robotSpeedRange = document.getElementById("robot-speed");
    robotSpeedRange.oninput = function () {
        teleop.scale = robotSpeedRange.value / 100
    }
    console.log('Teleop keyboard started.');

}

function createJoystick() {
    // Check if joystick was aready created
    if (manager == null) {
        joystickContainer = document.getElementById('joystick');
        // joystck configuration, if you want to adjust joystick, refer to:
        // https://yoannmoinet.github.io/nipplejs/
        var options = {
            zone: joystickContainer,
            position: { left: 50 + '%', top: 105 + 'px' },
            mode: 'static',
            size: 200,
            color: '#0066ff',
            restJoystick: true
        };
        manager = nipplejs.create(options);
        // event listener for joystick move
        manager.on('move', function (evt, nipple) {
            // nipplejs returns direction is screen coordiantes
            // we need to rotate it, that dragging towards screen top will move robot forward
            var direction = nipple.angle.degree - 90;
            if (direction > 180) {
                direction = -(450 - nipple.angle.degree);
            }
            // convert angles to radians and scale linear and angular speed
            // adjust if youwant robot to drvie faster or slower
            var lin = Math.cos(direction / 57.29) * nipple.distance * 0.005;
            var ang = Math.sin(direction / 57.29) * nipple.distance * 0.05;
            // nipplejs is triggering events when joystic moves each pixel
            // we need delay between consecutive messege publications to
            // prevent system from being flooded by messages
            // events triggered earlier than 50ms after last publication will be dropped
            if (publishImmidiately) {
                publishImmidiately = false;
                moveAction(lin, ang);
                setTimeout(function () {
                    publishImmidiately = true;
                }, 50);
            }
        });
        // event litener for joystick release, always send stop message
        manager.on('end', function () {
            moveAction(0, 0);
        });
    }
    console.log('Joystick component created and rendered.');

}

function connect(){
  //IP Address of robot, can be local or global
  //If using global recommended to use a dynamic dns like noip

  //global connection requires port forwarding on port 80 for webserver
  // and port 9090 for rosbridge
  robot_IP = "127.0.0.1";

  //Init handle for rosbridge_websocket
  //Connect to ros master on robot using roslibjs on client and rosbridge on robot
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

//Once window DOM has loaded run our javascript
window.onload = function () {

    //setup ROS connection
    connect();

    //Start the ros node to publish on cmd_vel topic
    initVelocityPublisher();

    // get handle for video placeholder
    video = document.getElementById('video');

    //Populate video source using ros
  //  video.src = "http://" + robot_IP + ":8080/stream?topic=/camera/rgb/image_raw&type=mjpeg&quality=80";

    //Populate video source using uv4l
    video.src = "http://" + robot_IP + ":8080/stream/video.mjpeg";

    video.onload = function () {
        // reate the joystick control and put it on the page only after the video has loaded
        createJoystick();
        //Start listening to keystrokes only after the video has loaded
        initTeleopKeyboard();
    };
    //Use jquery to include the entire custom slider javascript
    $.getScript("slider.js");
}
