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
  let seqNum = 0; 
  const s3tbroot = "https://ibrowser-thumbnails.s3.us-east-2.amazonaws.com/tb_" // this should be coming in the file upload object
  $.get("/loadimages")
  .done(function(string){
      let images = JSON.parse(string);
      $('#inputImageList').empty();
      $.each(images, function(index, image) {
        paintBox('#inputImageList',s3tbroot,image,seqNum++);
      });
      // save to local storage
      localStorage.setItem('imageArray', string);
      localStorage.setItem('seqNum',"0");
      localStorage.setItem('maxImages',String(seqNum-1));
  })
}

// the box is the element that includes the thumbnail
paintBox = function (rootDiv,imageRoot,image,seqNum) {
  boxDiv = document.createElement('div');
  // Thumbnail box
  $(boxDiv).attr({
    "class":"box",
    "id": "id-"+image.imageID,
  });
  // Image Element
  imgElement = document.createElement('img');
  $(imgElement).attr({
    "src":    imageRoot+image.imageID,
    "alt":    image.filename ,
  });
  // Full screen modal box
  $(imgElement).click(function() {
    localStorage.setItem('seqNum',seqNum);
    paintFullScreen(image)
  });
  // Control elements
  boxControls = document.createElement('div');
  $(boxControls).attr({
    "class": "boxControl"
  })
  trashButton = document.createElement('i');
  $(trashButton).attr({
    "class": "fas fa-trash-alt trash",
  })
  $(trashButton).html('&nbsp');
  $(trashButton).click(function() {
    deleteImage(image);
  });
  selectButton = document.createElement('i');
  $(selectButton).attr({
    "class" : "far fa-check-circle select"
  })
  $(selectButton).click(function(clickEvent){
    selectImage(image,getSelectedTab());
  })
  $(boxControls).append(trashButton);
  $(boxControls).append(selectButton);
  $(boxDiv).append(imgElement);
  $(boxDiv).append(boxControls);
  $(rootDiv).append(boxDiv); 
}

// Paint Full Screen Element
paintFullScreen = function(p){
  s3root = "https://ibrowser-images.s3.us-east-2.amazonaws.com/gl_" // this should be coming in the file upload object
  let imgElementFull = document.createElement('img');
  $(imgElementFull).attr({
    "src":    s3root+p.imageID,
    "alt":    p.filename ,
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
deleteImage = function(image) {
  let data = JSON.stringify(image);
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

selectImage = function(image,tab){
  let divName = tab+"Tab";
  let divNameJQ = '#'+tab+'Tab';
  const s3tbroot = "https://ibrowser-thumbnails.s3.us-east-2.amazonaws.com/tb_" 
  console.log(divName);
  document.getElementById(divName).innerHTML=""; 
  if (tab=="input" || tab=="reference") 
    { paintBox(divNameJQ,s3tbroot,image,1);}
}

launchProcess = function(evt){
  // this is a fairly dodgy way of storing the image info by extracting it from the dom
  // could use local storage, but that would also be redundant, so maybe... ?
  input = document.getElementById("inputTab").firstChild.id
  reference = document.getElementById("referenceTab").firstChild.id
  console.log(input + " " + reference);
  var obj = {'input': input, 'reference': reference}
  var objJSON = JSON.stringify(obj);
  $.ajax({
    url: "/process", 
    contentType : "application/json", 
    dataType: 'json',
    data: objJSON,
    type: 'post',
    success: function() {
      console.log('process call success');
    },
    error: function() {
      console.log('process call error')
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
    data: form_data,
    type: 'post',
    success: function() {
      console.log('Ajax success');
    },
    error: function() {
      console.log('upload call error');
    }
  });
});

// Move between tabs
function openTab(evt,tabName) {
  var i, tabcontent, tablinks;
  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  
  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

function getSelectedTab(){
  var x = document.getElementsByClassName("tabcontent");
  let selected = null;
  for (i = 0; i < x.length; i++) {
    if (x[i].getAttribute("style")=="display: block;") {
      selected = x[i].id;
    }
  }
  return selected;
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
    const messageData = JSON.parse(e.data);
    console.log('sse '+messageData.type);
    if (messageData.type == 'refresh') {
      loadImages();
    };
    if (messageData.type == 'output') {
      const divName = "outputTab";
      const divNameJQ = '#outputTab';
      const s3root = "https://ibrowser-output.s3.us-east-2.amazonaws.com/" // arg!
      const imageItem = messageData.data;
      document.getElementById(divName).innerHTML=""; 
      paintBox(divNameJQ,s3root,imageItem,1);
      document.getElementById("outputButton").click();
    }
});

