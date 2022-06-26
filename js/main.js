var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var inputMap = {};
var camera1 = null;
var ground = null;
var grounds = [];
var buildings = [];
var hero_start_pos = null;
var deadly_tiles = [];
var win_obj = null;
var godmode = false;

var createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };

function createHouse(position, scene){
    const box = BABYLON.MeshBuilder.CreateBox("box", {});
    box.position.x = position.x;
    box.position.y = position.y + 0.5;
    box.position.z = position.z;

    const roof = BABYLON.MeshBuilder.CreateCylinder("roof", {diameter: 1.3, height: 1.2, tessellation: 3}, scene);
    roof.position.x = position.x;
    roof.position.z = position.z;
    roof.scaling.x = 0.75;
    roof.rotation.z = Math.PI / 2;
    roof.position.y = position.y + 1.22;
}

function createBuilding(position, scene){

    let height = Math.floor(Math.random() * 2);

    let faceUV = [];
    faceUV[0] = new BABYLON.Vector4(0.75, 0.33, 1, 0.66); //rear face
    faceUV[1] = new BABYLON.Vector4(0.5, 0.33, 0.25, 0.66); //front face
    faceUV[2] = new BABYLON.Vector4(0.5, 0.33, 0.7, 0.66); //right side
    faceUV[3] = new BABYLON.Vector4(0, 0.33, 0.25, 0.66); //left side
    faceUV[4] = new BABYLON.Vector4(0.25, 0, 0.5, 0.33); //left side

    const botMat = new BABYLON.StandardMaterial("botMat");
    botMat.diffuseTexture = new BABYLON.Texture("./res/img/skyscraper-bottom-sheet.png", scene, true, true, 0);
    const midMat = new BABYLON.StandardMaterial("midMat");
    midMat.diffuseTexture = new BABYLON.Texture("./res/img/skyscraper-mid-sheet.png", scene, true, true, 0);
    const topMat = new BABYLON.StandardMaterial("topMat");
    topMat.diffuseTexture = new BABYLON.Texture("./res/img/skyscraper-top-sheet.png", scene, true, true, 0);
    
    const boxBot = BABYLON.MeshBuilder.CreateBox("box", {width: 4, height: 4, depth: 4, faceUV: faceUV, wrap: true});
    boxBot.physicsImpostor = new BABYLON.PhysicsImpostor(boxBot, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
        friction:0,
        restitution:0}, scene);
    boxBot.material = botMat;
    boxBot.position = position.clone();
    boxBot.position.y = 2;
    buildings.push(boxBot);
    
    for(let i = 0; i < height; i++){
        const boxMid = BABYLON.MeshBuilder.CreateBox("box-mid", {width: 4, height: 4, depth: 4, faceUV: faceUV, wrap: true});
        boxMid.physicsImpostor = new BABYLON.PhysicsImpostor(boxMid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0,
            restitution:0}, scene);
        boxMid.material = midMat;
        boxMid.position = position.clone();
        boxMid.position.y = 2 + 4 * (i + 1);
        buildings.push(boxMid);
    }

    const boxTop = BABYLON.MeshBuilder.CreateBox("box-top", {width: 4, height: 4, depth: 4, faceUV: faceUV, wrap: true});
    boxTop.physicsImpostor = new BABYLON.PhysicsImpostor(boxTop, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
        friction:0,
        restitution:0}, scene);
        boxTop.material = topMat;
        boxTop.position = position.clone();
        boxTop.position.y = 2 + 4 * (height + 1);
    buildings.push(boxTop);
}

function loadCat(position, scene){
    const collBox = BABYLON.MeshBuilder.CreateBox("hero-col-box", {width: 0.4, height: 0.2, depth: 0.4});
    collBox.physicsImpostor = new BABYLON.PhysicsImpostor(collBox, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 10, friction: 10, restitution: 0.01 }, scene);
    collBox.showBoundingBox = true;
    collBox.isVisible = false;
    collBox.position = position.clone();

    collBox.position.y = 1;

    hero_start_pos = collBox.position.clone();
    document.getElementById("ok").onclick = function(){
        window.location.reload();
    }

    var cat_scream = new BABYLON.Sound("gunshot", "res/snd/415209__inspectorj__cat-screaming-a.wav", scene);
    //collBox.rotate(new BABYLON.Vector3(0, 1, 0), Math.PI/2);
     // Load hero character and play animation
     BABYLON.SceneLoader.ImportMesh("", "./meshes/", "StripeTheCat.glb", scene, function (newMeshes, particleSystems, skeletons, animationGroups) {
        var hero = newMeshes[0];

        var animating = true;
        var heroSpeed = 0.14;
        var heroSpeedBackwards = 0.1;
        var heroRotationSpeed = 0.1;
        let jumpForce = 55;

        hero.parent = collBox;

        //hero.parent = collBox;

        hero.physicsImpostor = new BABYLON.PhysicsImpostor(newMeshes[0], BABYLON.PhysicsEngine.NoImpostor, { mass: 0, friction: 0.5, restitution: 1 }, scene);
        
        //Scale the model down        
        hero.scaling.scaleInPlace(0.1);
        //hero.rotation = new BABYLON.Vector3(0, Math.PI * 2, 0);

        //Lock camera on the character 
        //camera1.target = hero;
        camera1.lockedTarget = hero;

        //Get the Samba animation Group
        const walkAnim = scene.getAnimationGroupByName("WalkAttempt2");

        hero.position.y = -0.1;        

        scene.onBeforeRenderObservable.add(() => {
            let av = collBox.physicsImpostor.getAngularVelocity();
            collBox.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, av.y, 0));
            //console.log(collBox.rotationQuaternion.toEulerAngles());
            let angle = collBox.rotationQuaternion.toEulerAngles();
            let y = 180 - (angle.y * (180 / Math.PI));
            //camera1.setPosition(new BABYLON.Vector3(angle.y / 4, Math.PI/2, 10));
            camera1.alpha = -angle.y - Math.PI / 2;

            for(let i = 0; i < buildings.length; i++){
                let b = buildings[i];
                let v = collBox.physicsImpostor.getLinearVelocity();
                if(collBox.intersectsMesh(b)){
                    collBox.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, v.y, 0));
                    collBox.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
                }
            }
            if(!godmode){
                for(let i = 0; i < deadly_tiles.length; i++){
                    let t = deadly_tiles[i];
                    if(collBox.intersectsMesh(t)){
                        // TODO: pain sound
                        cat_scream.play();
                        console.log("Died!!")
                        collBox.position = hero_start_pos.clone();
                    }
                }
            }

            if(collBox.intersectsMesh(win_obj)){
                document.getElementById("win-scr-container").style.visibility = "visible";
                return;
            }
            

            var keydown = false;
            //Manage the movements of the character (e.g. position, direction)
            if (inputMap["w"]) {
                collBox.moveWithCollisions(collBox.forward.scaleInPlace(heroSpeed));
                keydown = true;
            }
            if (inputMap["s"]) {
                collBox.moveWithCollisions(collBox.forward.scaleInPlace(-heroSpeedBackwards));
                keydown = true;
            }
            if (inputMap["a"]) {
                collBox.rotate(BABYLON.Vector3.Up(), -heroRotationSpeed);
                keydown = true;
            }
            if (inputMap["d"]) {
                collBox.rotate(BABYLON.Vector3.Up(), heroRotationSpeed);
                keydown = true;
            }
            if (inputMap["b"]) {
                keydown = true;
            }
            if(inputMap[" "]){
                var on_ground = false;
                for(let i = 0; i < grounds.length; i++){
                    let g_i = grounds[i];
                    if(collBox.intersectsMesh(g_i)){
                        on_ground = true;
                    }
                }
                if(collBox.intersectsMesh(ground)){
                    on_ground = true;
                }
                if(on_ground){
                    console.log("Jump!");
                    var contactLocalRefPoint = BABYLON.Vector3.Zero();
                    collBox.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, jumpForce, 0), collBox.getAbsolutePosition().add(contactLocalRefPoint));
                }
                
            }
    
            //Manage animations to be played  
            if (keydown) {
                if (!animating) {
                    animating = true;
                    if (inputMap["s"]) {
                        //Walk backwards
                        //walkBackAnim.start(true, 1.0, walkBackAnim.from, walkBackAnim.to, false);
                    }
                    else if
                        (inputMap["b"]) {
                        //Samba!
                        //sambaAnim.start(true, 1.0, sambaAnim.from, sambaAnim.to, false);
                    }
                    else {
                        //Walk
                       // walkAnim.start(true, 1.0, walkAnim.from, walkAnim.to, false);
                       walkAnim.start(true, 1.6, walkAnim.from, walkAnim.to, false);
                    }
                }
            }
            else {
    
                if (animating) {
                    //Default animation is idle when no key is down     
                    /*idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false); */
    
                    //Stop all animations besides Idle Anim when no key is down
                    //sambaAnim.stop();
                    walkAnim.stop();
                    //walkBackAnim.stop();
    
                    //Ensure animation are played only once per rendering loop*/
                    animating = false;
                }
            }
        });

    });
}
function placePlayer(position, scene){
    loadCat(position, scene);
}

function placeStraightRoad(position, rotated, safe, scene){
    //console.log("Placing a road tile at " + position.x + ", " + position.z);
    var roadPlane = BABYLON.MeshBuilder.CreateGround("road", {width: 4, height: 4}, scene);
    const roadMat = new BABYLON.StandardMaterial("roadMat");
    if(rotated){
        roadMat.diffuseTexture = new BABYLON.Texture("./res/img/road-straight.png", scene, true, true, 0);
    } else {
        roadMat.diffuseTexture = new BABYLON.Texture("./res/img/road-straight-rotated.png", scene, true, true, 0);
    }
    roadPlane.material = roadMat;
    roadPlane.position = position.clone();
    if(!safe){
        deadly_tiles.push(roadPlane);
    }
}

function placeIntersection(position, scene){
    var intersectionPlane = BABYLON.MeshBuilder.CreateGround("intersction", {width: 4, height: 4}, scene);
    const roadMat = new BABYLON.StandardMaterial("roadMat");
    roadMat.diffuseTexture = new BABYLON.Texture("./res/img/road-intersection.png", scene, true, true, 0);
    intersectionPlane.material = roadMat;
    intersectionPlane.position = position.clone();
    deadly_tiles.push(intersectionPlane);
}

function generateJumpingBoxes(position, type, rot_deg, scene){

    var lower_y = 0.9;
    var mid_y = 1.8;

    if(type == 1){
        const b_lower = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 0.8 });
        b_lower.physicsImpostor = new BABYLON.PhysicsImpostor(b_lower, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);

        b_lower.position = position.clone();
        b_lower.position.x;
        b_lower.position.y += lower_y;
        b_lower.position.z += 1.6;
        grounds.push(b_lower);

        const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 0.8 });
        b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);

        b_mid.position = position.clone();
        b_mid.position.x -= 1.6;
        b_mid.position.y += mid_y;
        b_mid.position.z += 1.6;
        grounds.push(b_mid);
    } else if (type == 2){

        const b_mid_1 = BABYLON.MeshBuilder.CreateBox("box", {width: 4, height: 0.2, depth: 0.8 });
        b_mid_1.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid_1, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);

            b_mid_1.position = position.clone();
            b_mid_1.position.x += 0;
            b_mid_1.position.y += mid_y;
            b_mid_1.position.z += 1.6;
        grounds.push(b_mid_1);

        const b_mid_2 = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 3.8 });
        b_mid_2.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid_2, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);

            b_mid_2.position = position.clone();
            b_mid_2.position.x += 1.6;
            b_mid_2.position.y += mid_y;
            b_mid_2.position.z -= 0;
        grounds.push(b_mid_2);

    } else if(type == 3){
        if(rot_deg == 0){
            const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 0.8 });

            b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
                friction:0.5,
                restitution:0}, scene);
            b_mid.position = position.clone();

            b_mid.position.y = mid_y;
            b_mid.position.x -= 1.6;
            b_mid.position.z += 1.6;

            grounds.push(b_mid);

        } else if (rot_deg == 90){
            
        }

    } else if(type == 4){ // basic path right
        if(rot_deg == 0){
            const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 4, height: 0.2, depth: 0.8 });
            b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
                friction:0.5,
                restitution:0}, scene);
    
            b_mid.position = position.clone();
            b_mid.position.x += 0;
            b_mid.position.y += mid_y;
            b_mid.position.z += 1.6;
            grounds.push(b_mid);
        } else if (rot_deg == 90){
            const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 4 });
            b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
                friction:0.5,
                restitution:0}, scene);
    
            b_mid.position = position.clone();
            b_mid.position.x -= 1.6;
            b_mid.position.y += mid_y;
            b_mid.position.z -= 0;
            grounds.push(b_mid);
        }
         
    } else if(type == 5){ // Basic path left
        if(rot_deg == 0){
            const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 4 });
            b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
                friction:0.5,
                restitution:0}, scene);
    
            b_mid.position = position.clone();
            b_mid.position.x += 0;
            b_mid.position.y += mid_y;
            b_mid.position.z -= 1.6;
            grounds.push(b_mid);

        } else if (rot_deg == 90){
            const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 4 });
            b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
                friction:0.5,
                restitution:0}, scene);
    
            b_mid.position = position.clone();
            b_mid.position.x += 1.6;
            b_mid.position.y += mid_y;
            b_mid.position.z += 0;
            grounds.push(b_mid);
        }
        
    } else if(type == 6){ // connector R to L
        const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 1.2, height: 0.2, depth: 0.8 });
        b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
        b_mid.position = position.clone();
        b_mid.position.x += 1.2;
        b_mid.position.y += mid_y;
        b_mid.position.z += 1.6;
        grounds.push(b_mid);

        const connector_box = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 4});
        connector_box.physicsImpostor = new BABYLON.PhysicsImpostor(connector_box, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
            connector_box.position = position.clone();
            connector_box.position.x += 0;
            connector_box.position.y += mid_y;
            connector_box.position.z += 0;
        grounds.push(connector_box);

        const b_mid_2 = BABYLON.MeshBuilder.CreateBox("box", {width: 1.2, height: 0.2, depth: 0.8 });
        b_mid_2.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid_2, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
            b_mid_2.position = position.clone();
            b_mid_2.position.x -= 1.2;
            b_mid_2.position.y += mid_y;
            b_mid_2.position.z -= 1.6;
        grounds.push(b_mid_2);
    }  else if(type == 7){
        const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 0.8 });

        b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
        b_mid.position = position.clone();

        b_mid.position.y = mid_y;
        b_mid.position.x += 1.6;
        b_mid.position.z -= 1.6;

        grounds.push(b_mid);
    } else if(type == 8){ // connector L to R
        if(rot_deg == 0){
            const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 1.2 });
        b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
        b_mid.position = position.clone();
        b_mid.position.x += 1.2;
        b_mid.position.y += mid_y;
        b_mid.position.z -= 1.6;
        grounds.push(b_mid);

        const connector_box = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 4});
        connector_box.physicsImpostor = new BABYLON.PhysicsImpostor(connector_box, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
            connector_box.position = position.clone();
            connector_box.position.x += 0;
            connector_box.position.y += mid_y;
            connector_box.position.z += 0;
        grounds.push(connector_box);

        const b_mid_2 = BABYLON.MeshBuilder.CreateBox("box", {width: 1.2, height: 0.2, depth: 0.8 });
        b_mid_2.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid_2, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
            b_mid_2.position = position.clone();
            b_mid_2.position.x -= 1.2;
            b_mid_2.position.y += mid_y;
            b_mid_2.position.z += 1.6;
        grounds.push(b_mid_2);

        } else if(rot_deg == 90) {
            const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 1.2 });
        b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
        b_mid.position = position.clone();
        b_mid.position.x += 1.6;
        b_mid.position.y += mid_y;
        b_mid.position.z += 1.2;
        grounds.push(b_mid);

        const connector_box = BABYLON.MeshBuilder.CreateBox("box", {width: 4, height: 0.2, depth: 0.8});
        connector_box.physicsImpostor = new BABYLON.PhysicsImpostor(connector_box, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
            connector_box.position = position.clone();
            connector_box.position.x += 0;
            connector_box.position.y += mid_y;
            connector_box.position.z += 0;
        grounds.push(connector_box);

        const b_mid_2 = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 1.2 });
        b_mid_2.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid_2, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
            b_mid_2.position = position.clone();
            b_mid_2.position.x -= 1.6;
            b_mid_2.position.y += mid_y;
            b_mid_2.position.z -= 1.2;
        grounds.push(b_mid_2);
        }
    } else if(type == 9){
        const b_mid = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 0.8 });

        b_mid.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);
        b_mid.position = position.clone();

        b_mid.position.y = mid_y;
        b_mid.position.x += 1.6;
        b_mid.position.z += 1.6;
    } else if (type == 10){
        const b_mid_1 = BABYLON.MeshBuilder.CreateBox("box", {width: 4, height: 0.2, depth: 0.8 });
        b_mid_1.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid_1, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);

            b_mid_1.position = position.clone();
            b_mid_1.position.x += 0;
            b_mid_1.position.y += mid_y;
            b_mid_1.position.z += 1.6;
        grounds.push(b_mid_1);

        const b_mid_2 = BABYLON.MeshBuilder.CreateBox("box", {width: 0.8, height: 0.2, depth: 3.8 });
        b_mid_2.physicsImpostor = new BABYLON.PhysicsImpostor(b_mid_2, BABYLON.PhysicsImpostor.BoxImpostor,  {mass:0,
            friction:0.5,
            restitution:0}, scene);

            b_mid_2.position = position.clone();
            b_mid_2.position.x -= 1.6;
            b_mid_2.position.y += mid_y;
            b_mid_2.position.z -= 0;
        grounds.push(b_mid_2);
    }
    
}

function generateWinCondition(position, scene){
    const win_mesh = BABYLON.MeshBuilder.CreateBox("box", {width: 0.2, height: 4, depth: 4 });
    win_mesh.position = position.clone()
    win_mesh.position.x -= 1.6;
    win_mesh.position.y += 2;
    win_obj = win_mesh;
}

function generateLevel(scene){
    const tile_spacing = 4;
    for(let i = 0; i < 8; i++){
        for(let j = 0; j < 8; j++){
            let level_item = level[i][j];
            let tile_position = new BABYLON.Vector3(i * tile_spacing, 0.01, j * tile_spacing);

            console.log(i + ", " + j + ": " + level_item );

            if((level_item & tile_types.PLAYER_START) == tile_types.PLAYER_START){
                console.log("player")
                placePlayer(tile_position, scene);
                generateJumpingBoxes(tile_position, 1, scene);
            }
            if((level_item & tile_types.ROAD_STRAIGHT) == tile_types.ROAD_STRAIGHT){
                let jump_type = level_obstacle_types[i][j];
                let safe = (level_item & tile_types.PLAYER_START) == tile_types.PLAYER_START;
                placeStraightRoad(tile_position, false, safe, scene);
                generateJumpingBoxes(tile_position, jump_type, 0, scene);
            }
            if((level_item & tile_types.ROAD_STRAIGHT_ROT) == tile_types.ROAD_STRAIGHT_ROT){
                let jump_type = level_obstacle_types[i][j];
                placeStraightRoad(tile_position, true, false, scene);
                generateJumpingBoxes(tile_position, jump_type, 90, scene);
            }
            if((level_item  & tile_types.ROAD_INTERSECTION) == tile_types.ROAD_INTERSECTION){
                let jump_type = level_obstacle_types[i][j];
                placeIntersection(tile_position, scene);
                generateJumpingBoxes(tile_position, jump_type, 0, scene);
            }
            if((level_item & tile_types.BUILDING) == tile_types.BUILDING){
                createBuilding(tile_position, scene);
            }
            if((level_item & tile_types.EXIT) == tile_types.EXIT){
                generateWinCondition(tile_position, scene);
            }

        }
    }
}

var createScene = function () {
    
    engine.enableOfflineSupport = false; 
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
    var physicsPlugin = new BABYLON.CannonJSPlugin();
    
    camera1 = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI/ 2.5 , 4, new BABYLON.Vector3(0, -5, 0), scene);
    //camera1 = new BABYLON.ArcRotateCamera("camera1", 0, 0, 10, new BABYLON.Vector3(0, -5, 0), scene);
    //camera1 = new BABYLON.FollowCamera("camera1", new BABYLON.Vector3(0, 0, 0), scene);
    //camera1 = new BABYLON.ArcFollowCamera("arcfollow", Math.PI / 2, Math.PI / 4, 10, null, scene);
    //camera1 = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 15, -15), scene);
    scene.activeCamera = camera1;
    //scene.activeCamera.attachControl(canvas, true);
    camera1.lowerRadiusLimit = 2;
    camera1.upperRadiusLimit = 10;
    camera1.wheelDeltaPercentage = 0.01;

    // This targets the camera to scene origin
    //camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera1.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    scene.enablePhysics(gravityVector, physicsPlugin);
    
    /*
    createHouse(new BABYLON.Vector3(0, 0, -15), scene);
    loadCat(scene, camera1);

    createBuilding(new BABYLON.Vector3(0, 0, -15), scene);
    */

   generateLevel(scene);

    //var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 100, height: 100}, scene);
    //var ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 2, scene);
    ground = BABYLON.MeshBuilder.CreateBox("box", {width: 100, height: 10, depth: 100}, scene);
    ground.position.y = -5;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);

    
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        console.log(evt.sourceEvent.key);
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

    var music = new BABYLON.Sound("Music", "res/snd/462494__rucisko__busy-city-05.wav", scene, null, {
        loop: true,
        autoplay: true
      });

    return scene;
};
        var engine;
        var scene;
        
        initFunction = async function() {               
            var asyncEngineCreation = async function() {
                try {
                return createDefaultEngine();
                } catch(e) {
                console.log("the available createEngine function failed. Creating the default engine instead");
                return createDefaultEngine();
                }
            }

            engine = await asyncEngineCreation();

            
if (!engine) throw 'engine should not be null.';
scene = createScene();};
initFunction().then(() => {sceneToRender = scene        
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});