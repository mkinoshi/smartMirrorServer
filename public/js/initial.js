$( document ).ready(function() {
  setInterval(function() {
    var today = new Date();
    var month = (today.getMonth() + 1 ) + "/" + today.getDate();
    var hour = today.getHours();
    var minute = today.getMinutes();
    var second = today.getSeconds();
    $("#day")[0].innerHTML = month + " - " + hour + ":" + minute + ":" + second; 
  }, 1000)
  var socket = io();  
  socket.on('detected', function(msg){
    window.location = "http://localhost:3000/email/?user=" + msg;
  });
});
