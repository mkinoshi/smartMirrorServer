$( document ).ready(function() {
  setInterval(function() {
    var today = new Date();
    var month = (today.getMonth() + 1 ) + "/" + today.getDate();
    var hour = today.getHours().toString().length === 1 ? '0' + today.getHours() : today.getHours();
    var minute = today.getMinutes().toString().length === 1 ? '0' + today.getMinutes() : today.getMinutes();
    var second = today.getSeconds().toString().length === 1 ? '0' + today.getSeconds() : today.getSeconds();
    $("#day")[0].innerHTML = month + " - " + hour + ":" + minute + ":" + second; 
  }, 1000)
  setInterval(function() {
    window.location.reload();
  }, 5000)
  var socket = io();  
  socket.on('lost', function(msg){
    window.location = "http://localhost:3000/";
  });

});