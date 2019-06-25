var twist;
var cmdVel;
var publishImmidiately = true;
var robot_IP;
var manager;
var teleop;
var ros;
var map; //Main map object
var plannedPath; //Path planned in advance for robot
var robotPath; //Path that the robot is currently taking

var mapInit;
var currentMarker;
var robotMarker; //Current location of the robot
var markers = []; //List of all marker
var latLngs = []; //List of all latitude longitude pairs
var paths = [];
var robotPaths = [];

//var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
//Labels numbers and letters to cycle through when placing markers on map
var labels = 'H123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

//Keep track of which label to use
var labelIndex = 0;

//Import context menu code so we can right click the map and markers
$.getScript("context-menu.js", function() {
  //alert("Import worked");
});
//import * as mymodule from 'context-menu.js';

var menuStyle = {
 	menu: 'dropdown-menu',
 	menuSeparator: 'divider'
 };



/*
Main map initialisation function

Mapping:
Creates map. Also creates path vector for movement plan and path vector for
current robot motion

Context Menu:
Creates right click context menu with

*/
function initMap() {

  var myLatLng = {lat: -33.8284721, lng: 151.19212733};
  currentMarker = new google.maps.Marker({
    position: myLatLng,
    map: map,
    title: 'FIRST HARD CODED MARKER'
  });
  //create map and center on a position in Sydney, currently have POIs turned off
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: myLatLng,
    styles: [
    {
      "featureType": "poi",
      "stylers": [
        { "visibility": "off" }
      ]
    }
  ]
  });
//define a line symbol to use when making the planning path, currently a forward arrow
  var lineSymbol = {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
  };
  //forcibly make an MVCArray so we can get callbacks from Gmaps API on planned path updates
  var path = new google.maps.MVCArray([
  ]);
  //Create the planned path Gmaps polyline object and set its variables
  plannedPath = new google.maps.Polyline({
            path: path,
            editable: true,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            icons: [{
                icon: lineSymbol,
                offset: '100%'
              }]
          });
  //attach the planned path to the map so we can see it
  plannedPath.setMap(map);

  //forcibly make an MVCArray so we can get callbacks from Gmaps API on robot path updates

  var path = new google.maps.MVCArray([
  ]);
  //Create the robot path Gmaps polyline object and set its variables

  robotPath = new google.maps.Polyline({
            path: path,
            editable: false,
            geodesic: true,
            strokeColor: '#00FF00',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            icons: [{
                icon: lineSymbol,
                offset: '100%'
              }]
          });
  robotPath.setMap(map);
  //google.maps.event.addListener(map,  'rightclick',  function(mouseEvent) { alert('Right click triggered'); });

  //disable for now to test context menu
  map.addListener('click', function(e) {
           placeMarker(e,e.latLng, map,-1,true);
         });

  mapInit = true;

//Set the right click context menu options and their listener event names
  var contextMenuOptions  = {
   	classNames: menuStyle,
   	menuItems: [
   		{ label:'Centre Map Here', id:'menu_option1',
   			className: 'dropdown-item', eventName:'centremap_clicked' },
        { label:'Add Marker Here', id:'menu_option2',
     			className: 'dropdown-item', eventName:'addmarker_clicked' },
   		{ },
      { label:'Clear Map', id:'menu_option3',
   			className: 'dropdown-item', eventName:'deleteAll_clicked' }
   	],
   	pixelOffset: new google.maps.Point(0, 0),
   	zIndex: 5
   };
//Create the context menu object with the options we just outlined
  var contextMenu = new ContextMenu(map, contextMenuOptions);
//Define what to do if a listener callback is triggered
   google.maps.event.addListener(contextMenu, 'menu_item_selected',
    	function(event, eventName, source){
    	switch(eventName){
    		case 'centremap_clicked':
    			// do something
          //alert("Option 1 clicked")
          centreMap(event.latLng);
    			break;
    		case 'addmarker_clicked':
    			// do something else
          //alert("Option 2 clicked")
          placeMarker(event,event.latLng,map,-1,1);
    			break;
        case 'deleteAll_clicked':
    			// do something else
          clearMap();
    			break;
    		default:
    			//Event wasn't captured properly
    			break;
    	}
      //Once we've dealt with the callback hide the context menu
    	contextMenu.hide();
  });
//Define context menu options for the actual paths between markers
  var flightMenuOptions  = {
   	classNames: menuStyle,
   	menuItems: [
   		{ label:'Delete Segment', id:'menu_option1',
   			className: 'dropdown-item', eventName:'delete_segment' }
   	],
   	pixelOffset: new google.maps.Point(0, 0),
   	zIndex: 5
   };
   //Create the context menu object with the options we just outlined
  var flightMenu = new ContextMenu(map, flightMenuOptions);

  //Define what to do if a listener callback is triggered
   google.maps.event.addListener(flightMenu, 'menu_item_selected',
    	function(e, eventName, source){
      console.log("Flight menu item selected triggered");

    	switch(eventName){
    		case 'delete_segment':
    			// do something
          console.log("Delete edge " + e.edge);
          //alert("Delete edge  called")
    			break;

    		default:
    			//Couldn'nt find the actual callback event
    			break;
    	}
    	flightMenu.hide();
  });
//Set the generic map right click context menu to fire on right clicking anywhere random on the map
  google.maps.event.addListener(map, 'rightclick', function(mouseEvent) {
    //alert('Right click triggered');

    //contextMenu.show(mouseEvent.latLng, map);
    contextMenu.show(mouseEvent);
    //contextMenu.show(mouseEvent.latLng);

  });
  //Define a listener for the insert_at event of the path MVCArray
  //This event is triggered whenever any item is added to the path either by the user
  //explicitely or implicitely via dragging the midpoint handles
  google.maps.event.addListener(path, 'insert_at', function(vertex) {

	   console.log('Vertex '+ vertex + ' inserted to path.')
     latLng=plannedPath.getPath().getAt(vertex);
     if(!latLngExists(latLng)){
       console.log("Marker doesn't exist so creating new one");
       placeMarker(null,latLng,map,vertex,false);
     }
   });
   //This set_at event is triggered whenever any item in the path MVCArray is updated

   google.maps.event.addListener(path, 'set_at', function(vertex) {
     latLngNew=plannedPath.getPath().getAt(vertex);
     latLngOld=latLngs[vertex];

     updateMarker(latLngOld,latLngNew);
     console.log("LatLngOld is " + latLngOld + " LatLngNew is " + latLngNew);
     console.log('Vertex '+ vertex + ' set to new location.');
    });

//Apply right click flight context menu to the planned flightpath
  google.maps.event.addListener(plannedPath, 'rightclick', function(e) {
      //alert("Right click of path detected");
          // Check if click was on a vertex control point
          // if (e.vertex == undefined) {
          //   console.log("RETURNING VERTEX EMPTY");
          //   return;
          // }
          console.log("Right click of path detected");
          console.log(e);
          flightMenu.show(e);
          //deleteMenu.open(map, plannedPath.getPath(), e.vertex);
        });

  // refreshRobotMarker(-33.828719,151.189607)
}

//Centre the map on a lat lng pair
function centreMap(latLng){
  map.setCenter(latLng);
}

//Clear all the items off the map including markers and paths
function clearMap(){
  deleteAllMarkers();
  deleteAllPaths();
  deleteAllLatLngs();
}

//Iteratively delete all markers from the map
function deleteAllMarkers(){
  labelIndex=0;
  setMapOnAllMarkers(null);
  markers=[];
}

//Clear the LatLngs list
function deleteAllLatLngs(){
  latLngs=[];
}

//Delete all paths stored in the planned path set
function deleteAllPaths(){
  // setMapOnAllPaths(null);
  // paths=[];
  plannedPath.setPath([]);

  //
  // robotPath.setMap(null);
  // robotPath=null;

}

//Update a given marker on the map with a new location
function updateMarker(latLngOld, latLngNew){
    marker=findMarker(latLngOld);
    marker.setPosition(latLngNew);
    index = findLatLng(latLngOld);
    latLngs[index]=latLngNew;
}

//Give a lat lng pair, find its corresponding index in the global latlng list
function findLatLng(latLng){
  for(var index =0; index<this.latLngs.length;++index) {
    if(latLng.lat()==this.latLngs[index].lat() && latLng.lng()==this.latLngs[index].lng()){
      console.log("Found latlng at index " + index);
      return index;
    }
  }
  return null;

}

//Check if a given lat lng pair already exists in the global latlng list
function latLngExists(latLng){
  if(findMarker(latLng)!=null){
    return 1;
  }
  else{
    return 0;
  }
}

/*placeMarker

Place a marker at a given lat lng location on a specific map

e: the event that triggered this function call, may be empty or a context menu
latlng: the lat lng pair of the target marker
map: the map we wish to display the marker on
position: what position in the marker heirarchy do we insert this marker,
          if just to the end then use -1
needPath: does this marker need to have some sort of path connected to it


*/
function placeMarker(e,latLng, map, position,needPath) {
        console.log("The place marker function has been called:");

        //Determine which label to assign the marker based on the position fed into the method
        var labelNum=0;
        if(position==-1){
          labelNum=labels[markers.length % labels.length].toString();
        }
        else{
          labelNum=labels[position % labels.length].toString();
        }

        //Create a new marker object ready for insertion onto the map
        var marker = new google.maps.Marker({
          position: latLng,
          map: map,
          label: labelNum
        });
        //add marker to arraylist
        var path = plannedPath.getPath();
        //If no specific marker position is requested
        if(position==-1){
          //must push latLngs and markers first or else we may prematurely
          //trigger MVC insert_at event
          latLngs.push(latLng);
          markers.push(marker);
          if(needPath){
            path.push(latLng);
          }

        }
        else{
          //If the marker is to be inserted anywhere other than the end we will need to shift the labels
          shiftLabelsRight(position);
          latLngs.splice(position,0,latLng);
          markers.splice(position,0,marker);
          if(needPath){
            path.insertAt(position,latLng);
          }
        }

        //Custom context menu for when the marker icon is right clicked
        var contextMenuOptions  = {
         	classNames: menuStyle,
         	menuItems: [
         		{ label:'Delete Marker', id:'menu_option1',
         			className: 'dropdown-item', eventName:'delete_clicked' },
              { label:'Change Marker Position', id:'menu_option2',
           			className: 'dropdown-item', eventName:'change_clicked' },
         		{ },
            { label:'Set Home Marker', id:'menu_option3',
         			className: 'dropdown-item', eventName:'sethome_clicked' },
              { },
              { label:'Center on Marker', id:'menu_option4',
           			className: 'dropdown-item', eventName:'centermarker_clicked' }
         	],
         	pixelOffset: new google.maps.Point(0, 0),
         	zIndex: 5
         };

         //Build the contextmenu with the previously set options
        var contextMenu = new ContextMenu(map, contextMenuOptions);

        //Add the listeners to the built context menu
         google.maps.event.addListener(contextMenu, 'menu_item_selected',
            function(event, eventName, source){
            //console.log("Marker right click selected item with latlng " +latLng);
            console.log("Menu item marker context menu event:");
            console.log(event);

            switch(eventName){
              case 'delete_clicked':
                // do something
              //  alert("Delete marker clicked");
                deleteMarker(event.latLng);
                break;
              case 'change_clicked':
                // do something else
                alert("Marker Option 2 clicked");

                break;
              case 'sethome_clicked':
                // do something else
                alert("Marker Option 3 clicked");

                break;
              case 'centermarker_clicked':
                centerMap(latLng);
                break;
              default:
                // freak out
                break;
            }
            contextMenu.hide();
        });

        //Open the marker context menu when a marker icon is right clicked
        google.maps.event.addListener(marker, 'rightclick', function(mouseEvent) {
          //alert('Right click ON ' + markers.indexOf(marker) + ' triggered');

          //contextMenu.show(mouseEvent.latLng, map);
          console.log(mouseEvent);
          contextMenu.show(mouseEvent);
          //contextMenu.show(mouseEvent.latLng);

        });

        // var lineSymbol = {
        //   path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        // };
        //
        // var plannedPath = new google.maps.Polyline({
        //           path: latLngs,
        //           editable: true,
        //           geodesic: true,
        //           strokeColor: '#FF0000',
        //           strokeOpacity: 1.0,
        //           strokeWeight: 2,
        //           icons: [{
        //               icon: lineSymbol,
        //               offset: '100%'
        //             }]
        //         });
        // plannedPath.setMap(map);
        // paths.push(plannedPath);
      //  map.panTo(latLng);
      }

//Refresh the location of live robot marker on the map given separate lat lngs
function refreshRobotMarker(lat,lng) {
      console.log("Refreshing live robot marker");

      //Check if there exists a robot marker, if there is then get rid of it by setting map to null
      if(robotMarker!=null){
        robotMarker.setMap(null);
      }
      //Convert separate lat lngs into latlng pair
      latLng = new google.maps.LatLng(lat, lng);

      //Create the marker object with the defender icon!
      //old hardcoded marker code
      // icon: {'/defender_resized.png',

      var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        icon: '/defender_marker.png',
      });
      robotMarker = marker;
      //add marker to arraylist
      var path = robotPath.getPath();
      path.push(latLng);

      //latLngs.push(latLng);
      //markers.push(marker);
      // if(needPath){
      //   path.push(latLng);
      // }
      //
      // }
      // else{
      //   shiftLabelsRight(position);
      //   latLngs.splice(position,0,latLng);
      //   markers.splice(position,0,marker);
      //   if(needPath){
      //     path.insertAt(position,latLng);
      //   }


      //Create context menu for when we right click the live robot icon
      var contextMenuOptions  = {
       	classNames: menuStyle,
       	menuItems: [
       		{ label:'Delete Marker', id:'menu_option1',
       			className: 'dropdown-item', eventName:'delete_clicked' },
            { label:'Change Marker Position', id:'menu_option2',
         			className: 'dropdown-item', eventName:'change_clicked' },
       		{ },
          { label:'Set Home Marker', id:'menu_option3',
       			className: 'dropdown-item', eventName:'sethome_clicked' },
            { },
            { label:'Center on Marker', id:'menu_option4',
         			className: 'dropdown-item', eventName:'centermarker_clicked' }
       	],
       	pixelOffset: new google.maps.Point(0, 0),
       	zIndex: 5
       };

       //Create context menu object
      var contextMenu = new ContextMenu(map, contextMenuOptions);

      //Create listener for all the callbacks
       google.maps.event.addListener(contextMenu, 'menu_item_selected',
          function(event, eventName, source){
          //console.log("Marker right click selected item with latlng " +latLng);
          console.log("Menu item marker context menu event:");
          console.log(event);

          switch(eventName){
            case 'delete_clicked':
              // do something
            //  alert("Delete marker clicked");
              deleteMarker(event.latLng);
              break;
            case 'change_clicked':
              // do something else
              alert("Marker Option 2 clicked");

              break;
            case 'sethome_clicked':
              // do something else
              alert("Marker Option 3 clicked");

              break;
            case 'centermarker_clicked':
              centerMap(latLng);
              break;
            default:
              // freak out
              break;
          }
          contextMenu.hide();
      });
      //Make the context menu appear when the live robot marker is right clicked
      google.maps.event.addListener(marker, 'rightclick', function(mouseEvent) {
        //alert('Right click ON ' + markers.indexOf(marker) + ' triggered');

        //contextMenu.show(mouseEvent.latLng, map);
        console.log(mouseEvent);
        contextMenu.show(mouseEvent);
        //contextMenu.show(mouseEvent.latLng);


      });

      // var lineSymbol = {
      //   path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
      // };
      //
      // var plannedPath = new google.maps.Polyline({
      //           path: latLngs,
      //           editable: true,
      //           geodesic: true,
      //           strokeColor: '#FF0000',
      //           strokeOpacity: 1.0,
      //           strokeWeight: 2,
      //           icons: [{
      //               icon: lineSymbol,
      //               offset: '100%'
      //             }]
      //         });
      // plannedPath.setMap(map);
      // paths.push(plannedPath);
    //  map.panTo(latLng);
}

//Have a marker appear on a specific map
function setMapOnMarker(marker,map){
    marker.setMap(map);
}

//Shift the labels to the right for inserting a new marker
function shiftLabelsRight(index){
  for(var index =index; index<this.markers.length;++index) {
    var num= Number(markers[index].label)+1
    markers[index].setLabel(labels[num]);    }
  }

//Shift the labels to the left for deleting a marker
function shiftLabelsLeft(index){
  for(var index =index+1; index<this.markers.length;++index) {
      var num= Number(markers[index].label)-1
      markers[index].setLabel(labels[num]);
      //markers[index].setLabel("TEST");
    }
  }

//Find a marker object and return it given a latlng pair, else return null
function findMarker(latLng){
  if(latLng==null){
    return null;
  }
  for(var index =0; index<this.latLngs.length;++index) {
    if(latLng.lat()==this.latLngs[index].lat() && latLng.lng()==this.latLngs[index].lng()){
      console.log("Found marker at index " + index);
      return markers[index];
    }
  }
  return null;
}

//Go through the marker and latlng global lists to delete a marker object and update the path surrounding it
function deleteMarker(latLng){
  //deleteAllMarkers();
  //deleteAllPaths();
  listMarkers();
  console.log(latLng);
  console.log(latLng.lat());
  //setMapOnMarker();
  for(var index =0; index<this.latLngs.length;++index) {
    if(latLng.lat()==this.latLngs[index].lat() && latLng.lng()==this.latLngs[index].lng()){
      shiftLabelsLeft(index);
      setMapOnMarker(markers[index],null);
      this.latLngs.splice(index,1);
      this.markers.splice(index,1);
      var path = plannedPath.getPath();
      path.removeAt(index);
    }
  }
  //List markers for the console so we can debug
  listMarkers();
  //reorderMarkers();

}

//Iterate through all the stores markers and make them appear on the map
function setMapOnAllMarkers(map) {
        for (var i = 0; i < markers.length; i++) {
          //markers[i].setMap(map);
          setMapOnMarker(markers[i],map);
        }
      }

//Iterate through all the stored paths and make them appear on the map
function setMapOnAllPaths(map) {
        for (var i = 0; i < paths.length; i++) {
          paths[i].setMap(map);
        }
      }

//Reorder the markers
function reorderMarkers(){
  oldlatLngs=Array.from(latLngs);
  deleteAllLatLngs();
  for(var index =0; index<this.oldlatLngs.length;++index) {
    placeMarker(oldlatLngs[index],this.map);
  }

}

//List all the latlng pairs stored globablly in the console
function listLatLngs(){
  for(var index =0; index<this.latLngs.length;++index) {
    console.log("Lat " + latLngs[index].lat() + " Long " + latLngs[index].lng());
  }
}

//List all the global markers with their lat and lng coordinates in the console
function listMarkers(){
  for(var index =0; index<this.latLngs.length;++index) {
    console.log("Lat " + markers[index].position.lat() + " Long " + markers[index].position.lng());
  }
}

//List all the paths stored globbaly to the console
function listPaths(){
  path = plannedPath.getPath();
  console.log(path);
  for(var index =0; index<path.length;++index) {
    console.log("Lat " + path.getAt(index).lat() + " Long " + path.getAt(index).lng());
  }
}

//Create a rosnode that listens on the fix topic for GPS data
function fixListener(){

  var listener = new ROSLIB.Topic({
    ros : ros,
    name : '/fix',
    messageType : 'sensor_msgs/NavSatFix'
  });

//Test rosnode in future with a String check to indiicate robot online
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
    refreshRobotMarker(message.latitude,message.longitude)

    console.log('Received type ' + typeof(message));
  //  listener.unsubscribe();
  });


}

//Connect to the robot using websockets
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

  //If we successfully connect to the robot then log it to console
    ros.on('connection', function() {
     console.log('Connected to websocket server.');
  });
  //If we can't connect to robot then print an error to console
    ros.on('error', function(error) {
   console.log('Error connecting to websocket server: ', error);
  });
  //If for some reason our connection drops then print it to console
    ros.on('close', function() {
   console.log('Connection to websocket server closed.');
  });

}

//Once window DOM has loaded run our javascript
window.onload = function () {

  //setup ROS connection
  connect();

  //attatch the gps fix subscriber
  fixListener();

  //Once window is loaded then we can initialise the map
  initMap();

}
