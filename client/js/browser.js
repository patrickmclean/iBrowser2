// Function gets called once page load has succeeded
$(document).ready(function() {
    loadImages();
})

// Load list of stored images
loadImages = function() {
  $.get("/loadimages")
  .done(function(string){
      let images = JSON.parse(string);
      $('#imageList').empty();
      $.each(images, function(i, p) {
        paintBox('#imageList',p);
      });
  })
}

paintBox = function (root,p) {
  s3root = "https://ibrowser-images.s3.us-east-2.amazonaws.com/" // this should be coming in the file upload object
  boxDiv = document.createElement('div');
  $(boxDiv).attr("class","box");
  imgElement = document.createElement('img');
  $(imgElement).attr({
    "src":    s3root+p.filename,
    "width":  200,
    "alt":    p.filename ,
    "class":  "center-block"
    });
  $(boxDiv).append(imgElement);
  $(root).append(boxDiv); 
}

uploadFiles = function() {
  console.log('upload called');
}

//'http://localhost:8081/upload' 