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
  $(boxDiv).attr({
    "class":"box"
  });
  imgElement = document.createElement('img');
  $(imgElement).attr({
    "src":    s3root+p.filename,
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
      loadImages();
    }
  });
});

// The above waits a long time for s3 to come back synchronously
// Should replace with an event listener https://javascript.info/server-sent-events




//'http://localhost:8081/upload' 

/* this function might be a way to capture the input event
function previewFile() {
  var preview = document.querySelector('img');
  var file    = document.querySelector('input[type=file]').files[0];
  var reader  = new FileReader();

  reader.onloadend = function () {
    preview.src = reader.result;
  }

  if (file) {
    reader.readAsDataURL(file);
  } else {
    preview.src = "";
  }
}
*/