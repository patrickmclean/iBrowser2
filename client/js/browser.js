// Function gets called once page load has succeeded
$(document).ready(function() {
    loadImages();
})

// Load list of stored images
loadImages = function() {
  $.get("/loadimages")
  .done(function(string){
      let images = JSON.parse(string);
      $('#inputImageList').empty();
      $.each(images, function(i, p) {
        paintBox('#inputImageList',p);
      });
  })
}

paintBox = function (root,p) {
  s3root = "https://ibrowser-thumbnails.s3.us-east-2.amazonaws.com/tb_" // this should be coming in the file upload object
  boxDiv = document.createElement('div');
  $(boxDiv).attr({
    "class":"box"
  });
  imgElement = document.createElement('img');
  $(imgElement).attr({
    "src":    s3root+p.imageID,
    "height": "100%",
    "alt":    p.filename ,
    "class":  "center-block",
    "max-width": "95%"
    });
  $(boxDiv).append(imgElement);
  $(root).append(boxDiv); 
}

// Process file upload
$(document).on("click", "#upload", function() {
  let list = $("#fileInput").prop("files");
  var form_data = new FormData(); // Format over the wire is form data
  for (i=0 ; i < list.length; i++){
    form_data.append("fileName",list[i]); 
  }
  
  $.ajax({
    url: "http://localhost:8081/upload", 
    dataType: 'script',
    cache: false,
    contentType: false,
    processData: false,
    data: form_data,
    type: 'post',
    success: function() {
      console.log('Ajax came back');
      // this doesn't work - to be figured out.
    },
    complete: function (data){
      console.log('Ajax complete'+data);
      // loadImages(); Need to change this - will load images after cascade of pubsub
    }
  });
});

// Move between tabs
function openTab(tabName) {
  var i;
  var x = document.getElementsByClassName("imageTab");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none"; 
  }
  document.getElementById(tabName).style.display = "block"; 
}

// Event listener for server side events
// Captures page refresh updates
// Info on SSE: https://javascript.info/server-sent-events
const sseSource = new EventSource('/serverstream');

sseSource.addEventListener('message', (e) => {
    const messageData = e.data;
    console.log(messageData);
    loadImages();
});