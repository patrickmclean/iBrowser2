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

# Steps
Create a basic node web server that serves a static html page. Done.
Create a basic add image page
* Start with adding filename to database - Done
* Then add upload of image to s3, and image info to database - Done
Then add image browser 


Set up a api server in node
Set up a database in dynamodb - each row is an image file reference
Set up an s3 bucket for the image files
Set up a webpage for image file upload
Set up a webpage for a gallery viewer


# current issue - how to cascade back up the response from the scan command to the front end. Right now it's stuck in the 
# callback for the scan command in ddb.