$( document ).ready(function() {
  var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  var today = new Date();
  var month = (today.getMonth() + 1 ) + "/" + today.getDate();
  var ind = today.getDay();
  var day = days[ind]
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  $("#day")[0].innerHTML = month + " - " + h + ":" + m + ":" + s; 
});
