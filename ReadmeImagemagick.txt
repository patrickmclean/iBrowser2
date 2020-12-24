Installation was a pain
Brew install imagemagick is the core.
Drops it in /usr/local/Cellar on the mac 

Ran into problems with python, supposedly
Solution was brew install --force-bottle python3 
No idea what the force-bottle is about, but that was the critical move

Some example magick Scripts
magick ./input/input.jpg -resize '200x50%' ./output/output.jpg
