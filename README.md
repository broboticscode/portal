# Local Portal Quickstart

# Install ROS Kinetic on Ubuntu 16.04

# Project dependencies

```
ros-kinetic-rosbridge-suite ros-kinetic-web-video-server
```



# Install Turtlesim to Test (Optional)

Install Turtlesim
```
sudo apt-get install ros-$(rosversion -d)-turtlesim
```

# Run Simulation and Portal

Start roscore

```
roscore
```

If you want to stream video through ROS use
```
rosrun web_video_server web_video_server
```
Else you can use UV4l with

```
uv4l --driver uvc --device-id 046d:0819
```
and replace device-id with your UVC compatible webcam


Run turtlesim (Optional)

```
rosrun turtlesim turtlesim_node
```
Launch the rosbridge server to connect the portal to the ros simulation or robot_IP

```
roslaunch rosbridge_server rosbridge_websocket.launch
```
Run rostopic to listen in (Optional)
```
rostopic echo /turtle1/cmd_vel
```

# Controls

Use the onscreen virtual joy or the WASD keys to move the turtlesim bot!
