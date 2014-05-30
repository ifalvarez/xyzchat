xyzchat
=======

- text chat: telnet <host> 9399
- web client: <host>:8090
- private messages: /w <username> <message>
- emoticons: if the whole message sent is one of the following emoticons it will be sent as an image to web clients:    :)    :P    :*    :'(    :D    :@    ;)

github repo: https://github.com/ifalvarez/xyzchat

This chat is my first node.js application :)
I first built the basic text chat, when that worked, I created the web client. After that I refactored to separate the chat logic from the presentation to be able to give proper features to the web client, built those features and at the end just tweaked it a bit to try to make it look nice.

To install it in your environment:

Prerequites:
- Node.js: http://nodejs.org/download/
- Git: http://git-scm.com/download

Instructions:

1. Clone the repo:      git clone https://github.com/ifalvarez/xyzchat.git xyzchat
2. Go to the folder:    cd xyzchat
3. Run the main script: node main.js
4. Access is on ports:  9399 for tcp, 8090 for web
