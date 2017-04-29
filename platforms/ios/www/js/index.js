/*
 Jonathan Riordan
 C13432152
 */

var HOST = "http://188.166.82.38:8000"; // ask me for this in class

var URLS = {
updatenumberofattending: "/rest/updatenumberofattending/",
eventinformation: "/rest/eventinformation/",
getusernamebyid: "/rest/getusernamebyid/",
displayevents: "/rest/geteventusername/",
displayevents: "/rest/displayevents/",
addeventtomap: "/rest/addeventtomap/",
listfriends: "/rest/listfriends/",
addfriend: "/rest/addfriend/",
searchuser: "/rest/searchuser/",
getgroups: "/rest/getgroups/",
addgroup: "/rest/addgroup/",
signup: "/rest/signup/",
login: "/rest/tokenlogin/",
userme: "/rest/userme/",
updateposition: "/rest/updateposition/"
};

var map;
var newMarker;
var buttonToDisplay = true;

var curIcon = L.ExtraMarkers.icon({
                                  icon: 'fa-crosshairs',
                                  iconColor: 'white',
                                  markerColor: 'blue',
                                  shape: 'square',
                                  prefix: 'fa'
                                  });

var curIcon2 = L.ExtraMarkers.icon({
                                  icon: 'fa-crosshairs',
                                  iconColor: 'white',
                                  markerColor: 'red',
                                  shape: 'square',
                                  prefix: 'fa'
                                  });

function onLoad() {
    console.log("In onLoad.");
    document.addEventListener('deviceready', onDeviceReady, false);
}

function onDeviceReady() {
    console.log("In onDeviceReady.");
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
    
    $("#btn-login").on("touchstart", loginPressed);
    $("#sp-logout").on("touchstart", logoutPressed);
    $("#btn-register").on("touchstart", registerPressed);
    $("#friend-list").on("touchstart", friendList);
    $("#search-user").on("touchstart", searchForUser);
    $("#clear-search-user").on("touchstart", clearDirections);
    $("#sdd-event-to-map").on("touchstart", addEventtoMap);
    $("#show-events").on("touchstart", showEvents);
    

    if (localStorage.lastUserName && localStorage.lastUserPwd) {
        $("#in-username").val(localStorage.lastUserName);
        $("#in-password").val(localStorage.lastUserPwd);
    }
    
    $(document).on("pagecreate", "#map-page", function (event) {
                   console.log("In pagecreate. Target is " + event.target.id + ".");
                   
                   $("#goto-currentlocation").on("touchstart", function () {
                                                 getCurrentlocation();
                                                 });
                   
                   $("#map-page").enhanceWithin();
                   
                   makeBasicMap();
                   getCurrentlocation();
                   });

    
    $(document).on("pageshow", function (event) {
                   console.log("In pageshow. Target is " + event.target.id + ".");

//                   if (!localStorage.authtoken) {
//                   $.mobile.navigate("#login-page");
//                   }
                   setUserName();
                   });
    
    $(document).on("pageshow", "#map-page", function () {
                   console.log("In pageshow / #map-page.");
                   map.invalidateSize();
                   });

    
    $('div[data-role="page"]').page();
    
    console.log("TOKEN: " + localStorage.authtoken);
    if (localStorage.authtoken) {
        $.mobile.navigate("#map-page");
    } else {
        $.mobile.navigate("#login-page");
    }
}


// function to display and hide events on the map
function showEvents() {
    var user = localStorage.lastUserName;
    buttonToDisplay = !buttonToDisplay;
    
    if(buttonToDisplay) {
        var label = document.getElementById("show-events");
        label.innerHTML = "Display Events";
        clearDirections();
    } else {
        var label = document.getElementById("show-events");
        label.innerHTML = "Hide Events";
        $.ajax({
               type: "GET",
               headers: {
               "Content-Type": "application/x-www-form-urlencoded",
               "Authorization": localStorage.authtoken
               },
               url: HOST + URLS["displayevents"],
               data: {
               username: user
               }
               }).done(function (data, status, xhr) {
                       eventsToDisplay(data);
                       }).fail(function (xhr, status, error) {
                               console.log("Error Searching for user");
                               });
    }
}

function eventsToDisplay(data) {
    
    for (var i=0; i< data.Success.length; i++)
        for (var name in data.Success[i]) {
            console.log("Source: "+data.Success[i].name);
            console.log("Source: "+data.Success[i].latitude);
            console.log("Source: "+data.Success[i].longitude);
            console.log("Source: "+data.Success[i].member);
            console.log("Source: "+data.Success[i].time);
            
            var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
            var myLatLon = L.latLng(myPos.coords.latitude, myPos.coords.longitude);
            
            var dest = L.latLng(data.Success[i].latitude, data.Success[i].longitude);
            var distance = myLatLon.distanceTo(dest);
            var dis = distance.toFixed(2);
            
            var nameOfOwner = getOwner(data.Success[i].member);
            console.log("Owener of event : " + nameOfOwner);
            
            var myLatLon = L.latLng(data.Success[i].latitude, data.Success[i].longitude);
            L.marker(myLatLon, {icon: curIcon2}).addTo(map);
            
            var newMarkerr = new L.marker(myLatLon).addTo(map);
            newMarkerr.bindPopup('<h1><b>Event:  '+ data.Success[i].name +'</b></h1><label>Time: '+data.Success[i].time+'</label><label>Distance: '+dis+' meters</label><button onclick="showEventDetails(\'' + data.Success[i].latitude+ '\',\'' + data.Success[i].longitude+ '\',\'' + data.Success[i].name+ '\')">More Info</button><button onclick="directionToUser(\'' + data.Success[i].latitude+ '\',\'' + data.Success[i].longitude+ '\')">Directions</button>').openPopup();
            newMarkerr.valueOf()._icon.style.backgroundColor = 'green';
            
        }

}
function showEventDetails(lat, long, name) {
    $.mobile.navigate("#event-page");
    var title = document.getElementById("header-for-event");
    title.innerHTML = name;
    
    var div = document.getElementById("event-information");
    div.innerHTML = "";
    
    $.ajax({
           type: "GET",
           headers: {
           "Content-Type": "application/x-www-form-urlencoded",
           "Authorization": localStorage.authtoken
           },
           url: HOST + URLS["eventinformation"],
           data: {
           name: name,
           lat: lat,
           long: long
           }
           }).done(function (data, status, xhr) {
                   console.log(data);
                   var username = getOwner(data.Success[0].member)
                   var innerDiv = document.createElement("div");
                   innerDiv.innerHTML = '<h3>Time:  '+ data.Success[0].time +'</h3><br/><hr />'+
                   '<h3>Number of People Attending: '+data.Success[0].numberofpeople+'</h3><br><hr />'+
                   '<h3 id = "event-name-owener">Owner of Event: '+username+'</h3>' +
                   '<button id="sp-logout"  onClick = "attendEvent(\'' + name+ '\',\''+ lat+ '\',\'' + long + '\')" type="button" class="ui-btn ui-corner-all live-button"'+
                   'style="background-color: rgb(255, 149, 0); color: white;">'+
                   '<span class="fa fa-sign-in fa-lg"></span> Click to Attend Event'+
                   '</button>';
                   
                   div.appendChild(innerDiv);
                   
                   }).fail(function (xhr, status, error) {
                           console.log("Error Searching for user");
                           });
}

function attendEvent(name, lat, long) {
    
    // Ajax funciton to update the value for attending.
    
    $.ajax({
           type: "GET",
           headers: {
           "Content-Type": "application/x-www-form-urlencoded",
           "Authorization": localStorage.authtoken
           },
           url: HOST + URLS["updatenumberofattending"],
           data: {
           name: name,
           lat: lat,
           long: long
           }
           }).done(function (data, status, xhr) {
                   console.log(data);
                   showEventDetails(lat,long,name);
                   }).fail(function (xhr, status, error) {
                           console.log("Error Searching for user");
                           });
    
}


function getOwner(id) {
    var name = "";
    var username;
    console.log(id);
    
    $.ajax({
           type: "GET",
           headers: {
           "Content-Type": "application/x-www-form-urlencoded",
           "Authorization": localStorage.authtoken
           },
           url: HOST + URLS["getusernamebyid"],
           data: {
           id: id
           }
           }).done(function (data, status, xhr) {
                   name = data.Success;
                   console.log("Usernamessss: " + name);
                   var title = document.getElementById("event-name-owener");
                   title.innerHTML = "Owner of Event: " + name;
                   return name;
                   }).fail(function (xhr, status, error) {
                           console.log("Error Searching for user");
                           return "No name";
                            });

}


function searchForUser() {
    // function to search user by username
    // display the user ont the map.
    
    var user = document.getElementById("user-search-field").value;
    console.log(localStorage.authtoken);
    
    $.ajax({
           type: "GET",
           headers: {
           "Content-Type": "application/x-www-form-urlencoded",
           "Authorization": localStorage.authtoken
           },
           url: HOST + URLS["searchuser"],
           data: {
           username: user
           }
           }).done(function (data, status, xhr) {
                   console.log("User " + user + " data: " + data);

                   var lat = data.geometry.coordinates[0];
                   var long = data.geometry.coordinates[1];
                   console.log(lat);
                   console.log(long);
                   setUuseronmap(lat,long,user);

                   }).fail(function (xhr, status, error) {
                                console.log("Error Searching for user");
                           });
}

function onSuccess(position) {
    var lat = pos.coords.latitude;
    var lng = pos.coords.longitude;
    alert("lat : " + lat + " lng : " + lng);
    
}

function onError(error) {
    console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
}

function registerPressed() {
    console.log("Register buton pressed");
    
    var user = document.getElementById("in-username-signup");
    var password = document.getElementById("in-password1");
    var password2 = document.getElementById("in-password2");
    var name = document.getElementById("in-name");
    var lastname = document.getElementById("in-lastname");
    var email = document.getElementById("in-email");
    
    console.log("Password 1: " + password.value);
    console.log("Password 2: " + password2.value);
    
    // Password match
    if(password.value == password2.value) {
        console.log("User : " + user.value);
        console.log("password : " + password.value);
        console.log("name : " + name.value);
        console.log("lastname : " + lastname.value);
        console.log("email : " + email.value);
        
        if( (user.value =="") || (name.value == "") ||(password.value == "") || (password2.value == "") || (lastname.value == "") || (email.value == "") ) {
            alert("Plase fill in all the information");
        } else {
            // send post with data
            // register the user details.
            
            $.ajax({
                   type: "GET",
                   url: HOST + URLS["signup"],
                   data: {
                   username: user.value,
                   first_name: name.value,
                   last_name: lastname.value,
                   email: email.value,
                   password: password.value
                   }
                   }).done(function (data, status, xhr) {
 
    
            
                           $.mobile.navigate("#login-page");
                           }).fail(function (xhr, status, error) {
                                   var message = "Login Failed\n";
                                   if ((!xhr.status) && (!navigator.onLine)) {
                                   message += "Bad Internet Connection\n";
                                   }
                                   message += "Status: " + xhr.status + " " + xhr.responseText;
                                   showOkAlert(message);
                                   logoutPressed();
                                   });
        }
        
        
    } else {
       alert("Passwords do not match");
    }
    
    
}


// add an event to the map where the user selects
function addEventtoMap() {
    var eventName = prompt("Enter Event Name:");
    var eventTime = prompt("Enter the time for the event for today:");
    var element = document.getElementById("button-area-map");
    element.style.visibility = 'hidden';
    var user = localStorage.lastUserName;
    
    map.on('click', function(e) {

           // Update the database
           $.ajax({
                  type: "GET",
                  headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "Authorization": localStorage.authtoken
                  },
                  url: HOST + URLS["addeventtomap"],
                  data: {
                  lat: e.latlng.lat,
                  lon: e.latlng.lng,
                  username: user,
                  event_name: eventName,
                  event_time: eventTime
                  }
                  }).done(function (data, status, xhr) {
                          console.log("After ajax event");
                          
                          displayEvent(e.latlng.lat,e.latlng.lng,eventName);
                          
                          }).fail(function (xhr, status, error) {
                                  var message = "Event not added\n";
                                  if ((!xhr.status) && (!navigator.onLine)) {
                                  message += "Bad Internet Connection\n";
                                  }
                                  message += "Status: " + xhr.status + " " + xhr.responseText;
                                  showOkAlert(message);
                                  }).always(function () {
                                            $.mobile.navigate("#map-page");
                                            });
    
           
           })
    
    
}

function displayEvent(lat,long, name) {
    console.log("Event name to add " + name);
    var element = document.getElementById("button-area-map");
    element.style.visibility = 'visible';
    
    // Display marker
//    var eventToAdd = new L.marker(lat,long).addTo(map)
//    eventToAdd.bindPopup('<b>Event!! '+ name +'</b><br>').openPopup();
}

function loginPressed() {
    console.log("In loginPressed.");
    $.ajax({
           type: "GET",
           url: HOST + URLS["login"],
           data: {
           username: $("#in-username").val(),
           password: $("#in-password").val()
           }
           }).done(function (data, status, xhr) {
                   localStorage.authtoken = localStorage.authtoken = "Token " + xhr.responseJSON.token;
                   localStorage.lastUserName = $("#in-username").val();
                   localStorage.lastUserPwd = $("#in-password").val();
                   
                   $.mobile.navigate("#map-page");
                   }).fail(function (xhr, status, error) {
                           var message = "Login Failed\n";
                           if ((!xhr.status) && (!navigator.onLine)) {
                           message += "Bad Internet Connection\n";
                           }
                           message += "Status: " + xhr.status + " " + xhr.responseText;
                           showOkAlert(message);
                           logoutPressed();
                           });
}

function addGroup() {
    // User neter in group name
    // Retrueve user name that is curently logged in.
    // Create group with the owner.
    var group = prompt("Enter in Group name", "Friends");
    var user = localStorage.lastUserName;
    
    if( (user =="" ) || (group == "" ) || (group == null)) {
        alert("Plase fill in all the information");
    } else {
        // send post with data
        // register the user details.
        
        $.ajax({
               type: "GET",
               url: HOST + URLS["addgroup"],
               data: {
               username: user,
               group_name: group
               }
               }).done(function (data, status, xhr) {
                       friendList();
                       }).fail(function (xhr, status, error) {
                               var message = "Login Failed\n";
                               if ((!xhr.status) && (!navigator.onLine)) {
                               message += "Bad Internet Connection\n";
                               }
                               message += "Status: " + xhr.status + " " + xhr.responseText;
                               showOkAlert(message);
                               logoutPressed();
                               });
    }
    
}


function mapPageButton() {
    console.log("Map button pressed");
    $.mobile.navigate("#map-page");
}

function friendList() {
    console.log("Friend List Button Pressed.");
    
    // Retireve all the groups to the user logged in.
    var index = 0;
    var keys = [];
    var user = localStorage.lastUserName;
    var table = document.getElementById("friend-list-table");
    table.innerHTML = "";
    var object = "";
    
    console.log("Access the database for the groups.");
    
    var groupArea = document.getElementById("group-names");
    groupArea.innerHTML = "";
    $.ajax({
           type: "GET",
           url: HOST + URLS["getgroups"],
           data: {
           username: user
           }
           }).done(function (data, status, xhr) {
                   console.log(data);
                   
                   for(keys in data)
                   {
                    var elements = data[keys];
                    //console.log(elements);
                    for(var k in elements) {
                        var elementss = elements[k];
                        console.log(elementss.name);
                   
                        // Create element to display on the page.
                        var div = document.createElement("div");
                        div.innerHTML = '<br> <hr />';
                        var name = elementss.name;
                        var label = document.createElement("div");
                        label.innerHTML = '<button type="button" class="ui-btn ui-corner-all"' +
                        'onclick="displayFriends(\'' + elementss.name+ '\');" style="background-color: rgb(255, 59, 48); color: white;">' +
                        '<span class="fa fa-sign-in fa-lg"></span>'+elementss.name+'' +
                        '</button> ';

                        groupArea.appendChild(div);
                        div.appendChild(label);
                    }
                   }
                   
                   }).fail(function (xhr, status, error) {
                           
                           });
    $.mobile.navigate("#friend-page");
}


// Function to add user to friend group
function addFriendToGroup() {
    console.log("Add freind to group button pressed");
    var person = prompt("Enter Username to add", "");
    var user = localStorage.lastUserName;
    var group_name = localStorage.lastGroupSelected;
    console.log("Group name: " + group_name);
    
    if(person != "" || person != null) {
        $.ajax({
               type: "GET",
               url: HOST + URLS["addfriend"],
               data: {
               username: user,
               groupname: group_name,
               person: person
               }
               }).done(function (data, status, xhr) {
                       console.log(data);
                       displayFriends(group_name);
                       for(keys in data)
                       {
                        var elements = data[keys];
                        console.log("elements : " + elements);
                       }
                       
                       }).fail(function (xhr, status, error) {
                                alert("Username invalied");
                               });
    }

        
    
}


// Function to retireve friend names in a friend grouo.
function displayFriends(group_name) {
    console.log("displayFriends button pressed");
    $.mobile.navigate("#friend-list-page");
    
    var div = document.getElementById("group-names-members");
    div.innerHTML = "";
    var groupName = document.getElementById("friend-group-name");
    groupName.textContent = group_name;
    var user = localStorage.lastUserName;
    localStorage.lastGroupSelected = group_name;
    
    // Request friends and display in a list
    $.ajax({
           type: "GET",
           url: HOST + URLS["listfriends"],
           data: {
           username: user,
           groupname: group_name,
           }
           }).done(function (data, status, xhr) {

                   var nameArray;
                   for(friend in data) {
                   console.log(data[friend]);
                   nameArray = data[friend];
                   
                   }
                   
                   console.log("Name Array");
                   console.log(nameArray);
                   
                   for(i in nameArray) {
                   console.log(nameArray[i]);
                   var label = document.createElement("div");
                   label.innerHTML = "<label>"+nameArray[i]+"</label><br><hr />";
                   div.appendChild(label);

                   }
    
                   }).fail(function (xhr, status, error) {

                           });

}


//Display members in a group on the map.

function displayFriendsOnMap(group_name) {
    console.log("displayFriends on map button pressed");
    
    var groupName = localStorage.lastGroupSelected;
    var user = localStorage.lastUserName;
    
    console.log("Username Logged in : " + user);
    console.log("Group name to get : " + groupName);
    
    // Request friends and display in a list
    $.ajax({
           type: "GET",
           url: HOST + URLS["listfriends"],
           data: {
           username: user,
           groupname: groupName,
           }
           }).done(function (data, status, xhr) {
                   
                   var nameArray;
                   for(friend in data) {
                   console.log(data[friend]);
                   nameArray = data[friend];
                   
                   }
                   
                   console.log("Name Array");
                   console.log(nameArray);
                   
                   for(i in nameArray) {
                    addFriendToMap(nameArray[i]);
                   }
                   $.mobile.navigate("#map-page");
                   
                   }).fail(function (xhr, status, error) {
                           console.log("Error displaying friends on map");
                           });
    
}

function addFriendToMap(friend) {
    console.log("Friend to display on map : " + friend);
    
    $.ajax({
           type: "GET",
           headers: {
           "Content-Type": "application/x-www-form-urlencoded",
           "Authorization": localStorage.authtoken
           },
           url: HOST + URLS["searchuser"],
           data: {
           username: friend
           }
           }).done(function (data, status, xhr) {
                   console.log("Friend to display " + friend);
                   
                   var lat = data.geometry.coordinates[0];
                   var long = data.geometry.coordinates[1];
                   console.log(lat);
                   console.log(long);
                   setUuseronmap(lat,long,friend);
                   
                   }).fail(function (xhr, status, error) {
                           console.log("Error Searching for user");
                           });
}

function navigateToGroups() {
    $.mobile.navigate("##friend-page");
}

function signUpPressed() {
    console.log("In signUpPressed.");
    $.mobile.navigate("#signup-page");
}


function logoutPressed() {
    console.log("In logoutPressed.");
    localStorage.removeItem("authtoken");
    $.mobile.navigate("#login-page");
     $.ajax({
         type: "GET",
         headers: {"Authorization": localStorage.authtoken}
         // url: HOST + URLS["logout"]
     }).always(function () {
         map.remove();
         makeBasicMap();
         localStorage.removeItem("authtoken");
         $.mobile.navigate("#login-page");
     });
}

function showOkAlert(message) {
    navigator.notification.alert(message, null, "WMAP 2017", "OK");
}


function getCurrentlocation() {
    
    console.log("In getCurrentlocation.");
    var myLatLon;
    var myPos;

    
    navigator.geolocation.getCurrentPosition(
                                             function (pos) {
                                             // myLatLon = L.latLng(pos.coords.latitude, pos.coords.longitude);
                                             myPos = new myGeoPosition(pos);
                                             localStorage.lastKnownCurrentPosition = JSON.stringify(myPos);

                                             setMapToCurrentLocation();
                                             updatePosition();
                                             console.log(myPos);
                                             console.log("Inner function");
                                             },
                                             function (err) {
                                             },
                                             {
                                             enableHighAccuracy: true
                                             // maximumAge: 60000,
                                             // timeout: 5000
                                             }
                                             );
     console.log("Outer function");
    
}


function setUuseronmap(lat, long, username) {
    
    console.log("In set user friend location.");
    console.log("username : " + username);
    
    var userLongitude = parseFloat(long);
    var userLatitude = parseFloat(lat)
    
    console.log("long : " + userLongitude);
    console.log("lat : " + userLatitude);
    
    var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
    var myLatLon = L.latLng(myPos.coords.latitude, myPos.coords.longitude);
    
    var dest = L.latLng(userLongitude, userLatitude);
    var distance = myLatLon.distanceTo(dest);
    var dis = distance.toFixed(2);
    
    var userPosition = L.latLng(userLongitude,userLatitude);
    L.marker(userPosition, {icon: curIcon2}).addTo(map);
    var userSearchMarker = new L.marker(userPosition).addTo(map)
    userSearchMarker.bindPopup('<h2><b>Its your friend!! '+ username +'</b><h2><br><label>Distance: '+dis+' meters</label><br/><button onclick="directionToUser(\'' + userLongitude+ '\',\'' + userLatitude+ '\')">Directions</button>').openPopup();
}

function directionToUser(userLongitude,userLatitude) {
    //alert("Directions to: " + userLongitude + " " + userLatitude);
    
    // Get user logged in position
    console.log("Direction to user pressed");
    var element = document.getElementById("button-area-map");
    element.style.visibility = 'hidden';

    var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);

    L.Routing.control({
                      waypoints: [
                                  L.latLng(myPos.coords.latitude, myPos.coords.longitude),
                                  L.latLng(userLongitude, userLatitude)
                                  ]
                      }).addTo(map);
}

// Function, clear map
function clearDirections() {
    var userSearch = document.getElementById("user-search-field");
    userSearch.value = "";
    
    var element = document.getElementById("button-area-map");
    element.style.visibility = 'visible';
    
    map.remove();
    makeBasicMap();
    setMapToCurrentLocation();
    updatePosition();
}


// funciton to set map to current postion
function setMapToCurrentLocation() {
    console.log("In setMapToCurrentLocation.");
    if (localStorage.lastKnownCurrentPosition) {
        
        var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
        var myLatLon = L.latLng(myPos.coords.latitude, myPos.coords.longitude);
        L.marker(myLatLon, {icon: curIcon}).addTo(map);
        
        newMarker = new L.marker(myLatLon).addTo(map);
        newMarker.bindPopup('<b>Its you!! '+ localStorage.lastUserName +'</b>').openPopup();
        map.flyTo(myLatLon, 15);
    }
}

function hideMarker(position) {
    // Alert
    alert(position);
}



function updatePosition() {
    
    console.log("In updatePosition.");
    if (localStorage.lastKnownCurrentPosition) {
        var myPos = JSON.parse(localStorage.lastKnownCurrentPosition);
        console.log(myPos);
        $.ajax({
               type: "PATCH",
               headers: {
               "Content-Type": "application/x-www-form-urlencoded",
               "Authorization": localStorage.authtoken
               },
               url: HOST + URLS["updateposition"],
               data: {
               lat: myPos.coords.latitude,
               lon: myPos.coords.longitude
               }
               }).done(function (data, status, xhr) {
                       showOkAlert("Position Updated");
                       }).fail(function (xhr, status, error) {
                               var message = "Position Update Failed\n";
                               if ((!xhr.status) && (!navigator.onLine)) {
                               message += "Bad Internet Connection\n";
                               }
                               message += "Status: " + xhr.status + " " + xhr.responseText;
                               showOkAlert(message);
                               }).always(function () {
                                         $.mobile.navigate("#map-page");
                                         });
    }
}

function makeBasicMap() {
    console.log("In makeBasicMap.");
    map = L.map("map-var", {
                zoomControl: false,
                attributionControl: false
                }).fitWorld();
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                useCache: true
                }).addTo(map);
    
    $("#leaflet-copyright").html("Leaflet | Map Tiles &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors");
}

function myGeoPosition(p) {
    this.coords = {};
    this.coords.latitude = p.coords.latitude;
    this.coords.longitude = p.coords.longitude;
    this.coords.accuracy = (p.coords.accuracy) ? p.coords.accuracy : 0;
    this.timestamp = (p.timestamp) ? p.timestamp : new Date().getTime();
}

function setUserName() {
    console.log("In setUserName.");
    $.ajax({
           type: "GET",
           headers: {"Authorization": localStorage.authtoken},
           url: HOST + URLS["userme"]
           }).done(function (data, status, xhr) {
                   $(".sp-username").html(xhr.responseJSON.properties.username);
                   }).fail(function (xhr, status, error) {
                           $(".sp-username").html("");
                           });
}
