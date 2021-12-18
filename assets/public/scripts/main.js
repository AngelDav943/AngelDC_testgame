const canvas = document.querySelector('#Canvas3D');
const socket = io();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 50, (window.innerWidth-200) / window.innerHeight, 0.1, 1000 );

let localplayer = undefined;

const renderer = new THREE.WebGLRenderer({
	canvas,
	alpha: true
});

renderer.setSize( window.innerWidth-200, window.innerHeight, false);
window.onresize = function(e) {
	renderer.setSize( window.innerWidth, window.innerHeight, false);
};

var plane_material = new THREE.MeshPhongMaterial( {color: 0x117d11, side: THREE.DoubleSide} );
var defaultmaterial = new THREE.LineBasicMaterial( {
	color: 0xff00ff,
	linewidth: 1,
} );

var cube_mesh = new THREE.BoxGeometry();
var plane_mesh = new THREE.PlaneGeometry(100,100);

var newCube = function(color,textureurl,debg) {
	var debug = debg || false
	let c = null; 
	if (textureurl && !c) {
		var texture = new THREE.TextureLoader().load(textureurl);
		c = new THREE.Mesh( cube_mesh, new THREE.MeshPhongMaterial({map:texture,wireframe:debug}) );
	} else {
		var texture = new THREE.TextureLoader().load('https://testgame.angeldc943.repl.co/assets/guest.png');
		c = new THREE.Mesh( cube_mesh, new THREE.MeshPhongMaterial({map:texture, color:color,wireframe:debug}) );
	}
	
	return c;
}

let otherCubes = {};
socket.on("connect", (res) => {
	console.log(res)
	for (player in otherCubes) {
		scene.remove(otherCubes[player].cube);
		delete otherCubes[player];
	}
});


socket.on("disconnect", () => {
	alert('Damn you got disconnected from the server.');
});

socket.on('otherPlayers',(players) => {
	for (p in players) {
		let res = players[p]
		var texture = new THREE.TextureLoader().load(res.image);
		otherCubes[res.id] = res 
		res.cube = newCube(res.color, res.image)
		console.log(res == localplayer)

		scene.add(otherCubes[res.id].cube);

		otherCubes[res.id].positiontomove = new THREE.Vector3(res.position.x/100,res.position.y/100,res.position.z/100);
		otherCubes[res.id].cube.position.x = res.position.x/100;
		otherCubes[res.id].cube.position.y = res.position.y/100;
		otherCubes[res.id].cube.position.z = res.position.z/100;
	}
});

socket.on("player_spawn", (res) => {
	localplayer = otherCubes[res.id];
});

socket.on("spawn", (res) => {
	otherCubes[res.id] = res;
	var texture = new THREE.TextureLoader().load(res.image);
	res.cube = newCube(res.color, res.image);

	scene.add(otherCubes[res.id].cube);
	otherCubes[res.id].positiontomove = new THREE.Vector3(res.position.x/100,res.position.y/100,res.position.z/100) 
	otherCubes[res.id].cube.position.x = res.position.x/100;
	otherCubes[res.id].cube.position.y = res.position.y/100;
	otherCubes[res.id].cube.position.z = res.position.z/100;
});


socket.on("despawn", (res) => {
	scene.remove(otherCubes[res.id].cube);
	delete otherCubes[res.id];
});

socket.on("cube_newposition", data => {
	if (data.id) {
		otherCubes[data.id].positiontomove = new THREE.Vector3(data.position.x/100,data.position.y/100,data.position.z/100)
	}
});

var light = new THREE.PointLight( 0xffffff, 1.5, 50 );
var plane = new THREE.Mesh( plane_mesh, plane_material );
const hemisphereLight = new THREE.HemisphereLight(0xB1E1FF, 0xB97A20, 0.5);

scene.add(hemisphereLight);
scene.add(plane);
scene.add(light);

plane.position.y = -0.5
plane.rotation.x = 1.57
camera.rotation.x = -1.32

light.castShadow = true;
light.position.set(0,2,3)
camera.position.y = 8;

function toScreenXY(object) {
    var width = window.innerWidth, height = window.innerHeight;
	var widthHalf = width / 2, heightHalf = height / 2;

	var pos = object.position.clone();
	pos.project(camera);
	pos.x = ( pos.x * widthHalf ) + widthHalf;
	pos.y = - ( pos.y * heightHalf ) + heightHalf;

	return pos
}

const raycaster = new THREE.Raycaster()

document.addEventListener("click", (event) => {
	let positiontomove = new THREE.Vector3(0,0,0)
	const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }
    raycaster.setFromCamera(mouse, camera);

	let objects = [];
	for (p in otherCubes) {
		if (p != localplayer.id) objects.push(otherCubes[p].cube)
	}
	objects.push(plane)

    const intersects = raycaster.intersectObjects(objects, false);
	//console.log(intersects)

    if (intersects.length > 0) {
        positiontomove = intersects[0].point
        positiontomove.y += .5 //raise it so it appears to sit on grid
		positiontomove = removeVector3Decimals(positiontomove) // remove some decimals
        
		var p = newCube(null,null,true)
		scene.add(p)
		p.position.add(positiontomove)

		setTimeout(() => {
			scene.remove(p)
		},500)

		socket.emit('position_change',{
			"x":positiontomove.x*100,
			"y":positiontomove.y*100,
			"z":positiontomove.z*100
		})
    }
})



function removeVector3Decimals(v) {
	let vector3 = v
	vector3.x = Math.ceil(vector3.x*100)/100
	vector3.y = Math.ceil(vector3.y*100)/100
	vector3.z = Math.ceil(vector3.z*100)/100
	return vector3
}

function update() {
	requestAnimationFrame(update);
	camera.aspect = window.innerWidth / window.innerHeight;
	
	if (localplayer && localplayer.cube) {
		camera.position.lerp(new THREE.Vector3(localplayer.cube.position.x,localplayer.cube.position.y+8,localplayer.cube.position.z+2),0.1)
	}

	for (c in otherCubes) {
		otherCubes[c].cube.position.lerp(otherCubes[c].positiontomove,0.05)
	}

	camera.updateProjectionMatrix()
	renderer.render(scene, camera);
	
};


update();