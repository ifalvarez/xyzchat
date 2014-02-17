xyzchat
=======

Engineering test for game closure

- text chat: telnet 54.205.195.250 9399
- web client: http://54.205.195.250:8090
- private messages: /w <username> <message>
- emoticons: if the whole message sent is one of the following emoticons it will be sent as an image to web clients:    :)    :P    :*    :'(    :D    :@    ;)

github repo: https://github.com/ifalvarez/xyzchat

This chat is my first node.js application, but it seemed like the right tool for the test :)
The process was iterative. I first built the basic text chat, when that worked, I created the web client. After that I refactored to separate the chat logic from the presentation to be able to give proper features to the web client, built those features and at the end just tweaked it a bit to try to make it look nice.
