socket.on("new_message", (arg) => {
    fetch("https://testgame.angeldc943.repl.co/assets/templates/comment.html").then(data => {
        return data.text()
    }).then(html => {
        let name = arg.user.split('<;userseparator;>')
        let message = html.replace(/<content>/g,arg.message).replace(/<userdisplay>/g,name[0]).replace(/<user>/g,name[1])
        message = message.replace(/<userid>/g,arg.userid).replace(/<accprofile>/g,arg.accprofile)
        document.getElementById('ChatContainer').innerHTML += message
        document.getElementById('ChatContainer').scrollTop = document.getElementById('ChatContainer').scrollHeight;
    })
});

function broadcast_message() {
    socket.emit('chatted',document.getElementById("message").value)
    document.getElementById("message").value = ""
}

socket.emit('chat/connected')