// Function gets called once page load has succeeded
$(document).ready(function() {
    // Load images on first open
    loadImages(); 

    // Set the modal closing behavior - either through X or clicking outside
    // clean up the clean up by putting a proper div in for the content
    document.getElementsByClassName("close")[0].onclick = function() {
      document.getElementById("modalBrowser").style.display = "none";
      document.getElementById("modal-content").removeChild(document.getElementById("modal-content").firstElementChild);
    }
    window.onclick = function(event) {
      if (event.target == document.getElementById("modalBrowser")) {
        document.getElementById("modalBrowser").style.display = "none";
        document.getElementById("modal-content").removeChild(document.getElementById("modal-content").firstElementChild);
      }
    }
    // Modal opening is set in paintBox below

})

// Load list of stored images
loadImages = function() {
  let s = 0; // seqNum
  $.get("/loadimages")
  .done(function(string){
      let images = JSON.parse(string);
      $('#inputImageList').empty();
      $.each(images, function(i, p) {
        paintBox('#inputImageList',p,s++);
      });
      // save to local storage
      localStorage.setItem('imageArray', string);
      localStorage.setItem('seqNum',"0");
      localStorage.setItem('maxImages',String(s-1));
  })
}

// the box is the element that includes the thumbnail
paintBox = function (root,p,s) {
  s3tbroot = "https://ibrowser-thumbnails.s3.us-east-2.amazonaws.com/tb_" // this should be coming in the file upload object
  boxDiv = document.createElement('div');
  // Thumbnail box
  $(boxDiv).attr({
    "class":"box",
    "id": "id-"+p.imageID,
    "position": "relative"
  });
  // Image Element
  imgElement = document.createElement('img');
  $(imgElement).attr({
    "src":    s3tbroot+p.imageID,
    "height": "90%",
    "alt":    p.filename ,
    "class":  "center-block",
    "max-width": "95%",
  });
  // Full screen modal box
  $(imgElement).click(function() {
    localStorage.setItem('seqNum',s);
    paintFullScreen(p)
  });
  // Control elements
  boxControls = document.createElement('div');
  $(boxControls).attr({
    "class": "boxControl"
  })
  trashButton = document.createElement('i');
  $(trashButton).attr({
    "class": "fas fa-trash-alt"
  })
  $(trashButton).html('&nbsp');
  $(trashButton).click(function() {
    deleteImage(p)
  });
  selectButton = document.createElement('i');
  $(selectButton).attr({
    "class" : "far fa-check-circle"
  })
  $(boxControls).append(trashButton);
  $(boxControls).append(selectButton);
  $(boxDiv).append(imgElement);
  $(boxDiv).append(boxControls);
  $(root).append(boxDiv); 
}

// Paint Full Screen Element
paintFullScreen = function(p){
  s3root = "https://ibrowser-images.s3.us-east-2.amazonaws.com/gl_" // this should be coming in the file upload object
  let imgElementFull = document.createElement('img');
  $(imgElementFull).attr({
    "src":    s3root+p.imageID,
    "height": "400px",
    "alt":    p.filename ,
    "class":  "center-block",
    "max-width": "95%",
  })
  let rootBrowser = document.getElementById("modalBrowser");
  rootBrowser.style.display = "block";
  let contentBrowser = document.getElementById("modal-content");
  contentBrowser.append(imgElementFull);
  let textElement = document.createElement('div');
  textElement.innerHTML = p.filename;
  contentBrowser.firstElementChild.append(textElement)
}

// Delete an image
deleteImage = function(p) {
  let data = JSON.stringify(p);
  $.ajax({
    url: "/deleteimage", 
    contentType: "application/json",
    data: data,
    type: 'post',
    success: function() {
      console.log('Ajax came back');
    },
    complete: function (data){
      console.log('Ajax complete'+data);
    }
  });
}


// Process file upload
$(document).on("click", "#upload", function() {
  let list = $("#fileInput").prop("files");
  var form_data = new FormData(); // Format over the wire is form data
  for (i=0 ; i < list.length; i++){
    form_data.append("fileName",list[i]); 
  }
  
  $.ajax({
    url: "/upload", 
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

// Move between images fullscreen
function lastImage(){
  let imageNum = Number(localStorage.getItem('seqNum'))-1;
  if (imageNum < 0) {imageNum = 0}; 
  let images = JSON.parse(localStorage.getItem('imageArray'));
  let md = document.getElementById('modal-content');
  md.removeChild(md.firstElementChild);
  paintFullScreen(images[imageNum]);
  localStorage.setItem('seqNum',String(imageNum));
}

function nextImage(){
  let imageNum = Number(localStorage.getItem('seqNum'))+1;
  let maxImages = Number(localStorage.getItem('maxImages'));
  if (imageNum > maxImages) {imageNum = maxImages}; 
  let images = JSON.parse(localStorage.getItem('imageArray'));
  let md = document.getElementById('modal-content');
  md.removeChild(md.firstElementChild);
  paintFullScreen(images[imageNum]);
  localStorage.setItem('seqNum',String(imageNum));
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

