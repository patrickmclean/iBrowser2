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




# What's next

Render has been stubbed out on deepart.
4. Find a way to notify at end of Render
5. Deploy ibrowser2 to amazon
6. Done!!




refresh happens for every image in multi upload. do it for just one??
Add error handling
Allow for launching a process on one or more files (art, remove people)


Output design
* On notification of output image created - this can be a reverse call to ibrowser
* Create a database entry
* Create a thumbnail
* Send a refresh to the front end
