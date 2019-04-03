# Local Portal Quickstart

## Project dependencies

#### ROS

First [install ROS Kinetic on Ubuntu 16.04](http://wiki.ros.org/kinetic/Installation/Ubuntu)

and then also rosbridge and a web video server for streaming.

```
ros-kinetic-rosbridge-suite ros-kinetic-web-video-server
```

#### GPS

Install GPSD package

```
sudo apt install gpsd
```

Install ROS GPS Common package

```
sudo apt-get install libgps-dev
mkdir gps_common/src
cd gps_common/src
git clone https://github.com/swri-robotics/gps_umd.git
cd ..
catkin_make
```

#### UV4l (Video Streaming)

Install UV4l for Ubuntu folling the instructions [here](https://www.linux-projects.org/uv4l/installation-ubuntu/)

#### Install Turtlesim to Test (Optional)

Install Turtlesim
```
sudo apt-get install ros-$(rosversion -d)-turtlesim
```

#### Hardware

* [Logitec Webcam C210](https://support.logitech.com/en_us/product/webcam-c210)
* [VK-172 Gmouse USB GPS Receiver](https://www.amazon.com.au/VK-172-Gmouse-Receiver-Adapter-Antenna/dp/B077NW1F4S)

## Run Simulation and Portal

Start roscore

```
roscore
```
Launch the rosbridge server to connect the portal to the ros simulation or robot_IP

```
roslaunch rosbridge_server rosbridge_websocket.launch
```

#### Video

If you want to stream video through ROS use
```
rosrun web_video_server web_video_server
```
Else you can use UV4l with

```
uv4l --driver uvc --device-id 046d:0819
```
and replace device-id with your UVC compatible webcam

#### GPSD
Ensure GPSD is started on your GPS module serial port (Optional)

```
gpsd -Nn /dev/ttyACM0
```
Run GPS node (Optional)

```
source devel/setup.bash
rosrun gpsd_client gpsd_client
```

Listen in on /fix

```
rostopic echo /fix
```

#### Turtlesim

Run turtlesim (Optional)

```
rosrun turtlesim turtlesim_node
```
Run rostopic to listen in (Optional)
```
rostopic echo /turtle1/cmd_vel
```

## Controls

Use the onscreen virtual joy or the WASD keys to move the turtlesim bot!
