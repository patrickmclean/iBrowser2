# Basic image management solution 
# Initial intent is to leverage for the deepart project

# To run locally
node ./server/main.js
http://localhost:8081

# To deploy

# Access the server
Goto Scripts and run: ./sshaws.sh 
This assumes instance is running. 
If instance is stopped and restarted then IP address will need to be updated in this script

# Download the latest (need to move config out of the way due to .gitignore, must be a better way)
mv config ..
git pull
mv ../config .

# If git is being a pain in the xx then just rm -rf * and do a fresh pull:
# git clone https://github.com/patrickmclean/iBrowser2.git

# If config is changed, use filezilla sftp to upload config file
# Don't ever publish the AWS credentials on github!

restart the app:
ps -aux to get the process number
kill -9 PID
node ./server/main.js &
Application is running on X.X.X.X:8081


# Setting up a new server on ec2
Install nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
Activate nvm: . ~/.nvm/nvm.sh
Install node: nvm install node
Install express: npm install express (what's the difference nvm, npm!)
Install aws-sdk: npm install aws-sdk







# User stories
I can see a list with thumbnails of images that I can use as source images
I can see a list with thumbnails of images that I can use as references
I can upload an image to either list
I can process a deepart
I can see a third list of the results



# What's next
Add a delete button
Add a select button
Add tagging, so the uploads to different tabs have different tags (could be directory but probably not)
Launch deepart, including launching and stopping the server

refresh happens for every image in multi upload. do it for just one??
Clean up the front end - decent display
Add error handling
Allow for launching a process on one or more files (art, remove people)

Better presentation of thumbnails
Use cropping: https://www.w3docs.com/snippets/css/how-to-crop-and-center-an-image-automatically-in-css.html
Create a fill algorithm where the photos fill the full space.
General idea: fixed height rows. Then do a calculation based on the aspect ratio of the images
how many should be in each row, and how wide. Then adjust the grid property to fit.
Means we need one .myContainer per row (currently the grid is the same on every row)
Also means that rather than processing the images sequentially we need to do a readahead
and process the image display in row batches. 
This needs to be done tied to css mediaquery which adds an additional challenge - probably 
need to get that back through js.