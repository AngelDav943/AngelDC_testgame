let socket_cookies = socket.handshake.headers.cookie
accounts.verifyuser(cookies.getCookie(socket_cookies,"uid")).then(account => {
	var id = Math.ceil(Math.random()*100000)
	if (players[id] == undefined) {

		if (account) 
		{
			id += "_"+account.id
		}
		else
		{
			account = {
				"displayname": "Guest",
				"name": `Guest${id}`,
				"Guest": true
			}
		}

		function getRandomColor() {
			var letters = '0123456789ABCDEF';
			var color = '#';
			for (var i = 0; i < 6; i++) {
				color += letters[Math.floor(Math.random() * 16)];
			}
			return color;
		}
		
		var image = ``
		if (account && account.Guest != true) image = `https://angeldc943.repl.co/assets/images/userprofiles/${account.id+1}.png`

		players[id] = {
			"id":id,
			"color":getRandomColor(),
			"image":image,
			"position":{
				"x":(4*Math.random()),
				"y":0,
				"z":(-3*Math.random())
			}
		}


		socket.emit("otherPlayers",players)
		socket.broadcast.emit('spawn',players[id])
		socket.emit('player_spawn',players[id])
		try {
			var profileimage = "https://testgame.angeldc943.repl.co/assets/guest.png"
			if (image != ``) profileimage = image

			socket.on('chatted', (messagedata) => {
				if (messagedata.replace(/ /g,"") != "")
				{
					var datamsg = {
						"user":account.name,
						"message":messagedata.toString(),
						"accprofile":profileimage
					}

					socket.emit('new_message',datamsg)
					socket.broadcast.emit('new_message',datamsg)
				}
			})

			socket.on('position_change', (newPosition) => {
				newPosition = newPosition || {x:0,y:0,z:0}

				let new_pos = {
					"id":id,
					"position":{
						"x":newPosition.x || 0,
						"y":newPosition.y || 0,
						"z":newPosition.z || 0
					}
				}
				if (last_newpos != new_pos) {
					players[id].position = new_pos.position
					socket.emit('cube_newposition',new_pos);
					socket.broadcast.emit('cube_newposition',new_pos);
					last_newpos = new_pos
				}
			})

		} catch(err) {
			console.log(err)
		}

		socket.on('disconnect', () => {
			delete players[id]
			socket.broadcast.emit('despawn',{
				"id":id
			})
		});
	}
})