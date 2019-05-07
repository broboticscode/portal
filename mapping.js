var twist;
var cmdVel;
var publishImmidiately = true;
var robot_IP;
var manager;
var teleop;
var ros;
var map;
var mapInit;
var currentMarker;
var markers = [];
var latLngs = [];
var paths = [];
//var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var labels = 'H123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

var labelIndex = 0;

//var contextMenuOptions = null;
//var contextMenu = null;
$.getScript("context-menu.js", function() {
  //alert("Import worked");
});
//import * as mymodule from 'context-menu.js';

var menuStyle = {
 	menu: 'dropdown-menu',
 	menuSeparator: 'divider'
 };




function initMap() {

  var myLatLng = {lat: -33.8284721, lng: 151.19212733};
  currentMarker = new google.maps.Marker({
    position: myLatLng,
    map: map,
    title: 'FIRST HARD CODED MARKER'
  });
  //create map with options, currently have POIs turned off
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
  //google.maps.event.addListener(map,  'rightclick',  function(mouseEvent) { alert('Right click triggered'); });

  //disable for now to test context menu
  map.addListener('click', function(e) {
           placeMarker(e.latLng, map);
         });
  mapInit = true;





  // map.setContextMenu({
  //   control: 'map',
  //   options: [{
  //     title: 'Add marker',
  //     name: 'add_marker',
  //     action: function(e) {
  //       this.addMarker({
  //         lat: e.latLng.lat(),
  //         lng: e.latLng.lng(),
  //         title: 'New marker'
  //       });
  //     }
  //   }, {
  //     title: 'Center here',
  //     name: 'center_here',
  //     action: function(e) {
  //       this.setCenter(e.latLng.lat(), e.latLng.lng());
  //     }
  //   }]
  // });

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

  var contextMenu = new ContextMenu(map, contextMenuOptions);

   google.maps.event.addListener(contextMenu, 'menu_item_selected',
    	function(latLng, eventName, source){
    	switch(eventName){
    		case 'centremap_clicked':
    			// do something
          //alert("Option 1 clicked")
          centreMap(latLng);
    			break;
    		case 'addmarker_clicked':
    			// do something else
          //alert("Option 2 clicked")
          placeMarker(latLng,map);

    			break;
        case 'deleteAll_clicked':
    			// do something else
          clearMap();
    			break;
    		default:
    			// freak out
    			break;
    	}
    	contextMenu.hide();
  });

  google.maps.event.addListener(map, 'rightclick', function(mouseEvent) {
    //alert('Right click triggered');

    //contextMenu.show(mouseEvent.latLng, map);
    contextMenu.show(mouseEvent.latLng);
    //contextMenu.show(mouseEvent.latLng);


  });


}

function centreMap(latLng){
  map.setCenter(latLng);
}

function clearMap(){
  deleteAllMarkers();
  deleteAllPaths();
  deleteAllLatLngs();
}

function deleteAllMarkers(){
  labelIndex=0;
  setMapOnAllMarkers(null);
  markers=[];
}

function deleteAllLatLngs(){
  latLngs=[];
}

function deleteAllPaths(){
  setMapOnAllPaths(null);
  paths=[]
}

function placeMarker(latLng, map) {
        var marker = new google.maps.Marker({
          position: latLng,
          map: map,
          label: labels[labelIndex++ % labels.length]
        });
        //add marker to arraylist
        latLngs.push(latLng);
        markers.push(marker);

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

        var contextMenu = new ContextMenu(map, contextMenuOptions);

         google.maps.event.addListener(contextMenu, 'menu_item_selected',
            function(latLng, eventName, source){
            console.log(latLng);

            switch(eventName){
              case 'delete_clicked':
                // do something
                alert("Delete marker clicked");
                deleteMarker(latLng);
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

        google.maps.event.addListener(marker, 'rightclick', function(mouseEvent) {
          //alert('Right click ON ' + markers.indexOf(marker) + ' triggered');

          //contextMenu.show(mouseEvent.latLng, map);
          contextMenu.show(mouseEvent.latLng);
          //contextMenu.show(mouseEvent.latLng);


        });

        var lineSymbol = {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        };

        var flightPath = new google.maps.Polyline({
                  path: latLngs,
                  geodesic: true,
                  strokeColor: '#FF0000',
                  strokeOpacity: 1.0,
                  strokeWeight: 2,
                  icons: [{
                      icon: lineSymbol,
                      offset: '100%'
                    }]
                });
        flightPath.setMap(map);
        paths.push(flightPath);
      //  map.panTo(latLng);
      }
function deleteMarker(latLng){
  deleteAllMarkers();
  deleteAllPaths();
  for(var index =0; index<this.latLngs.length;++index) {
    if(latLng.lat()==this.latLngs[index].lat() && latLng.lng()==this.latLngs[index].lng()){
      this.latLngs.splice(index,1);
      this.markers.splice(index,1);
    }
  }
  listMarkers();
  reorderMarkers();

}

function setMapOnAllMarkers(map) {
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(map);
        }
      }
function setMapOnAllPaths(map) {
        for (var i = 0; i < paths.length; i++) {
          paths[i].setMap(map);
        }
      }

function reorderMarkers(){
  oldlatLngs=Array.from(latLngs);
  deleteAllLatLngs();
  for(var index =0; index<this.oldlatLngs.length;++index) {
    placeMarker(oldlatLngs[index],this.map);
  }

}

function listMarkers(){
  for(var index =0; index<this.latLngs.length;++index) {
    console.log("Lat " + latLngs[index].lat() + " Long " + latLngs[index].lng());
  }
}


function updateMarker(lat, lng){
  //var myLatLng = {lat: -25.363, lng: 131.044};
  var myLatLng = {lat: lat, lng: lng};

  // var marker = new google.maps.Marker({
  //   position: myLatLng,
  //   map: map,
  //   title: 'Hello World!'
  // });

  // currentMarker.setMap(null);
  // currentMarker = null;
  // currentMarker = marker;
  currentMarker.setPosition(myLatLng);
  currentMarker.setMap(map);

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
    updateMarker(message.latitude,message.longitude)

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
  //turned off connection temporarily
  //connect();
  //fixListener();

  //temporarily manually invoke this
  initMap();
}
