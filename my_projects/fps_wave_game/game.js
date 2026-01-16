import * as THREE from 'https://unpkg.com/three@0.168.0/build/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

//Abilita sombras
renderer.shadowMap.enabled = true;

// Atualizar tamanho quando a janela redimensionar
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

//Acessa os ids 'start', 'paused', 'game_over', 'wave'
const startText = document.getElementById("start");
const pausedText = document.getElementById("paused");
const game_over = document.getElementById("game_over");

//Booleana para verificar quando o jogo inicializar pela primeira vez
let startGame = false;

let gameOver = false;

const clock = new THREE.Clock();

function update(){
    
    const deltaTime = clock.getDelta();

        obstacleSpawn();
        grassSpawn();

    //Verifica se o usuário clico usando o 'isPointerLock'
    if (isPointerLock === true && gameOver === false){
        WASD(deltaTime);
        shoot(deltaTime);
        rotateX();

        if (noClip === false){
            gravity(deltaTime);
            jump_();

        }else{
            //NoClip mode ativo
        }

        onGround();
        debugMenuStatus();
        updateDebugUI();
        spawnEnemies();
        enemiesWave(deltaTime);
        enemiesMove(deltaTime);
        playerUI_();
        UI_();
        rotationCube();
        cubeRGB(deltaTime);
        enemyShoot(deltaTime);

        cube_rotation.innerText = cubeRotation;
        cube_color_RGB.innerText = cubeColorRGB;

        bullet_light.innerText = bulletLight;
        
        //Inicia o jogo
        startGame = true;

        //Adiciona ou remove 'PointLight' para a bala
        if (bulletLight === true){
            bullet.add(pointLight);

        }else{
            bullet.remove(pointLight);
        }

        //Esconde o 'pausedText'
        pausedText.classList.add("hidden");
        
        playerHealth.innerText = `Vida: ${player.userData.health}`;

        waveUI.innerText = `Wave: ${waveRound}`;
        nextWaveTimerUI.innerText = `Próxima Wave em: ${(nextWaveTimer.toFixed(0))}s`;

        if (nextWave === true){
            nextWaveTimerUI.classList.remove("hidden");

        }else{
            nextWaveTimerUI.classList.add("hidden");
        }
        
    }else{
        
        //Roda só uma vez antes do jogo começar pela primeira vez 
        if (startGame === true && gameOver === false){
            
            //Mostra o 'startText'
            pausedText.classList.remove("hidden");  
        }
    }
    
    if (startGame === true){
        startText.classList.add("hidden");
    }
    
    if (player.userData.health <= 0){
        gameOver = true;
        document.exitPointerLock();
        game_over.classList.remove("hidden");
    }

    // console.log(nextWaveTimer);
    
    // console.log(isPointerLock);
    
    requestAnimationFrame(update);
    renderer.render(scene, camera);
}

//Menu de debug//
const debug_ui = document.querySelector("#debug_ui");
const coordsElement = document.querySelector("#coords");

const cube_rotation = document.getElementById("cube_rotation");
const cube_color_RGB = document.getElementById("cube_color_RGB");

const bullet_light = document.getElementById("bullet_light");

//UI
const playerHealth = document.getElementById("player_health");
const playerUI = document.getElementById("player_UI");

const UI = document.getElementById("UI");
const waveUI = document.getElementById("wave");
const nextWaveTimerUI = document.getElementById("next_wave_timer");

let debugAtivo = false;

function debugMenuStatus(){
    if (!debug_ui.classList.contains("hidden")){
        debugAtivo = true;

    }else{
        debugAtivo = false;
    }
}

function playerUI_(){

    if (startGame === true){
        playerUI.classList.remove("hidden");
    }

    if (debugAtivo === true){
        playerUI.classList.add("hidden");

    }else{
        playerUI.classList.remove("hidden");
    }
}

function UI_(){
    if (startGame === true){
        UI.classList.remove("hidden");
    }

    if (debugAtivo === true){
        UI.classList.add("hidden");

    }else{
        UI.classList.remove("hidden");
    }
}

//Pega as coordenadas//
function updateDebugUI(){
    coordsElement.innerText = `x: ${player.position.x.toFixed(2)}` + " | " + `y: ${player.position.y.toFixed(2)}` + " | " + `z: ${player.position.z.toFixed(2)}`;
}

//Cor da Skybox//
scene.background = new THREE.Color(0x87ceeb);

//Booleanas para a rotação e RGB do cubo//
let cubeRotation = false;
let cubeColorRGB = false;

// const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.5);
// scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xFFFFFF, 3);
sunLight.position.set(100, 80, -250);
sunLight.castShadow = true;
scene.add(sunLight);

const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(30,30),
    new THREE.MeshBasicMaterial({color: 0xffdd33, side: THREE.DoubleSide})
);

sun.position.copy(sunLight.position); // Copia a posição da luz
sun.lookAt(0, 0, 0); // Faz o sol olhar para o centro da cena
scene.add(sun); // Adiciona o sol à cena

// Configurar câmera de sombra
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.left = -150;
sunLight.shadow.camera.right = 150;
sunLight.shadow.camera.top = 150;
sunLight.shadow.camera.bottom = -150;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.bias = -0.0001;

const geometryCube = new THREE.BoxGeometry(1, 1, 1);
const materialCube = new THREE.MeshBasicMaterial({color: 0xfcba03});
const cube = new THREE.Mesh(geometryCube, materialCube);

//Cria o Mesh do Player
const player = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 0.8, 4, 8),
    new THREE.MeshPhongMaterial({visible: true, opacity: 0})
);
player.castShadow = true;
player.receiveShadow = true;

//Cria o Mesh da Bala
const bullet = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    new THREE.MeshPhongMaterial({color: 0xff0000})
);
bullet.castShadow = true;
bullet.receiveShadow = true;

//Cria o Mesh da Bala do Inimigo
const enemyBullet = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    new THREE.MeshPhongMaterial({color: 0x0400ed})
);
enemyBullet.castShadow = true;
enemyBullet.receiveShadow = true;

//Cria o Mesh do Chão
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    new THREE.MeshStandardMaterial({color: 0x66ff00, side: THREE.DoubleSide})
);

ground.receiveShadow = true;

cube.name = "cube";
ground.name = "ground";

//Adiciona o Chão a sena
scene.add(ground);

//Rotaciona o Chão para deixá-lo reto
ground.rotation.x = Math.PI / 2;

//Muda a posição do 'y' para -1
ground.position.y = -1;
// console.log(ground.position);

let bulletLight = false;
const pointLight = new THREE.PointLight(0xFFFFFF, 1);

scene.add(player);
player.add(camera);

player.userData.health = 300;

scene.add(cube);
cube.position.z = -2;
cube.position.y = 1;

//Rotação do cubo//
let i = 0.005;

function rotationCube(){

    if(cubeRotation === true){
        cube.rotation.y += i;
        cube.rotation.x += i;
    }
}
//Rotação do cubo//

//Toggle cubo rgb//
let r = 255;
let g = 0;
let b = 0;

let rgb = "";
const colorSpeed = 60;

function cubeRGB(deltaTime){

    if (cubeColorRGB === true){
        r += deltaTime * colorSpeed;
        // g += deltaTime * colorSpeed;
        // b += deltaTime * colorSpeed;

    }else{
        //Não chama;
    }

    if (r > 255) r = 0;
    if (g > 255) g = 0;
    if (b > 255) b = 0;

    const ri = Math.floor(r);
    const gi = Math.floor(g);
    const bi = Math.floor(b);

    rgb = `rgb(${ri}, ${gi}, ${bi})`;

    cube.material.color.set(rgb);

};

let w = false;
let s = false;
let a = false;
let d = false;

let space = false;
let shift = false;

let moveSpeed = 8;

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3();

let noClip = false;

function WASD(deltaTime){
    
    if (noClip === true){

         // NoClip: segue a direção da câmera
        camera.getWorldDirection(forward);
        right.set(1, 0, 0).applyQuaternion(player.quaternion);
        up.set(0, 1, 0);

    }else{

        // Normal: segue a direção do player
        forward.set(0, 0, -1).applyQuaternion(player.quaternion);
        right.set(1, 0, 0).applyQuaternion(player.quaternion);
        up.set(0, 1, 0);

    }
    
    const move = new THREE.Vector3();
    
    if (w === true){
        move.add(forward);
    }
    if (s === true){
        move.sub(forward);
    }
    if (a === true){
        move.sub(right);
    }
    if (d === true){
        move.add(right);
    }
    
    if (shift === true){

        if (noClip === true){
            moveSpeed = 35 * deltaTime;

        }else{
            moveSpeed = 15 * deltaTime;
        }
        
    }else{
        
        if (noClip === true){
            moveSpeed = 20 * deltaTime;

        }else{
            moveSpeed = 8 * deltaTime;
        }
        
    }
    
    move.multiplyScalar(moveSpeed);
    player.position.add(move);
}

let velocityY = 0;
const jumpForce = 0.2; // Força do pulo
const gravityForce = 0.5;

function jump_(){
    
    if (canJump === true && space === true && onGroundBool === true){
        velocityY = jumpForce;
        canJump = false;
    }
}

function gravity(deltaTime){
    
    velocityY -= gravityForce * deltaTime;
    player.position.y += velocityY;
    
    if (player.position.y <= 0){
        
        if(onGroundBool === true){

            player.position.y = 0;
            velocityY = 0;

        }else{

            //Evita que o player caia infinitamente
            if(player.position.y <= -75){

                player.position.set(0, 0, 0);
                velocityY = 0;
            }

        }
    }
    
}

let obstacles = [];

let obstacleSpawned = false;

const obstaclesVariations = [
    0xff4444, // vermelho
    // 0x44ff44, // verde
    // 0x4444ff, // azul
    0xffff44, // amarelo
    // 0xff44ff, // magenta
    // 0x44ffff, // ciano
    0xff8844, // laranja
    // 0x8844ff, // roxo
    // 0x44ff88, // verde água
];

function obstacleSpawn(){

    if (obstacleSpawned === true) return;
    
    for (let i = 0; i < 10; i++){

        //Cria o Mesh do obstáculo
        const obstacle = new THREE.Mesh(
            new THREE.BoxGeometry(Math.floor(Math.random() * 5) + 2, Math.floor(Math.random() * 3) + 2, Math.floor(Math.random() * 2) + 2),
            new THREE.MeshPhongMaterial({color: obstaclesVariations[Math.floor(Math.random() * obstaclesVariations.length)]})
        );
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        
        obstacles.push(obstacle);

        obstacles[i].rotation.y = Math.floor(Math.random() * 2) * (Math.PI / 2);

        let x = 0, z = 0;

        do{
            x = (Math.random() - 0.5) * 120;
            z = (Math.random() - 0.5) * 120;

        }while (Math.sqrt(x*x + z*z) < 10) //Define a posição para spawn do obstáculo longe do player
        
        obstacle.position.set(x, 0, z);

        scene.add(obstacle);

    }
    
    obstacleSpawned = true;

}

const width = ground.geometry.parameters.width;
const height = ground.geometry.parameters.height;

const grassHeight = [0.1, 0.13, 0.17, 0.2];
// const grassColors = [0x00ff00, 0x33ff33, 0x66ff66, 0x99ff99];

let grassSpawned = false;

function grassSpawn(){
    
    if (grassSpawned) return;
    
    const spacing = 0.5; // Espaçamento entre cada grama
    const countX = Math.floor(width / spacing);
    const countZ = Math.floor(height / spacing);
    const count = countX * countZ;
    
    // Cria UM InstancedMesh para TODAS as gramas
    const grassMesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.02, grassHeight[Math.floor(Math.random() * grassHeight.length)], 0.02),
        new THREE.MeshPhongMaterial({color: 0x00ff00}),
        count
    );
    grassMesh.castShadow = true;
    grassMesh.receiveShadow = true;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    
    let index = 0;
    
    // Distribui a grama por toda área do ground
    for (let x = -width/2; x < width/2; x += spacing){
        for (let z = -height/2; z < height/2; z += spacing){
            
            if (index >= count) break;
            
            const randomHeight = grassHeight[Math.floor(Math.random() * grassHeight.length)];
            
            position.set(
                x + Math.random() * spacing * 0.5,
                -0.9,
                z + Math.random() * spacing * 0.5
            );
            
            matrix.identity(); // Reseta a matriz
            matrix.setPosition(position);
            matrix.scale(new THREE.Vector3(1, randomHeight / 0.1, 1)); // Escala altura
            grassMesh.setMatrixAt(index, matrix);
            
            index++;
        }
    }
    
    scene.add(grassMesh);
    grassSpawned = true;
}

const raycaster = new THREE.Raycaster();
const origin = new THREE.Vector3();

//Bala//
let bulletBool = false;

//Velocidade de movimentação da bala
const bulletSpeed = 25;

//Distância para o despawn da bala
const despawnBulletDis = 80;

let bullets = [];

const direction = new THREE.Vector3();

//Cria a bala
function createBullet(){
    
    const bulletClone = bullet.clone();

    // Usa a direcao real da camera no mundo para evitar quaternion invertido
    camera.getWorldDirection(direction);

  // Posiciona a bala na posicao atual da camera para sair exatamente de onde o jogador mira
    camera.getWorldPosition(origin);

    bulletClone.position.copy(origin);
    bulletClone.direction = direction.clone().normalize();

    scene.add(bulletClone);

    //Adiciona o 'bulletClone' como último lugar na lista 'bullets[]'
    bullets.push(bulletClone);
}

//Cria os vetores de posição do player e da bala
const posPlayer = new THREE.Vector3();
const posBullet = new THREE.Vector3();

// cube.userData.health = 5;


//Atira a bala
function shoot(deltaTime){
    
    if (bulletBool === true){
        createBullet();
        bulletBool = false;
    }
    
    //Percorre a lista 'bullets[]' assim que ela não tiver mais vazia
    for (let i = 0; bullets.length > i; i++){
        
        //Adicona velocida a cada bala já com a rotação certa
        bullets[i].position.add(bullets[i].direction.clone().multiplyScalar(bulletSpeed * deltaTime));
        
        const hitEnemy = checkBulletEnemyCollision(bullets[i]);
        const hitObstacle = checkBulletObstacleCollision(bullets[i]);
        
        if (hitEnemy !== null) {
            hitEnemy.userData.health--;
            
            if (hitEnemy.userData.health < 1) {
                scene.remove(hitEnemy);
                hitEnemy.userData.alive = false;
                
                // Remove o inimigo do array
                const enemyIndex = enemies.indexOf(hitEnemy);
                if (enemyIndex > -1) {
                    enemies.splice(enemyIndex, 1);
                }
            }
            
            scene.remove(bullets[i]);
            bullets.splice(i, 1);
            i--;
            
            continue;
        }

        if (hitObstacle !== null){

            scene.remove(bullets[i]);
            bullets.splice(i, 1);
            i--;

            continue;
        }

        //Atribui a posição global do player e da bala para os vetores, 'posPlayer' e 'posBullet'
        player.getWorldPosition(posPlayer);
        bullets[i].getWorldPosition(posBullet);
        
        //Calcula a distância do player para a bala e atribui a váriavel 'distancePlayerBullet'
        const distancePlayerBullet = posPlayer.distanceTo(posBullet);
        
        //Se a bala estiver a 'despawnBulletDis' de distância do player ela é removida da cena
        if (distancePlayerBullet > despawnBulletDis){
            
            //Remove a bala da cena
            scene.remove(bullets[i]);
            
            //Remove a bala da lista
            bullets.splice(i, 1);
            i--;
            
            continue;
        }
        
    }
}

let enemies = [];
let enemiesSpawned = false;

let waveRound = 0;
let nextWaveTimer = 0;
let cooldownNextWave = 4;

let qtdEnemiesSpawn = 1;

let nextWave = false;

function enemiesWave(deltaTime){
    // console.log(nextWaveTimer);
        
    if (enemies.length <= 0){

        nextWave = true;

        nextWaveTimer += deltaTime;

        if (nextWaveTimer >= cooldownNextWave){

            waveRound += 1;
            player.userData.health += 1;
            
            if (waveRound % 5 === 0){
                qtdEnemiesSpawn += 3;
                
            }else{
                //Spawna +1 inimigo a cada wave nova
                qtdEnemiesSpawn += 1;
            }

            nextWaveTimer = 0;
            enemiesSpawned = false;
            
        }
    }else{
        nextWave = false;
    }
}

const enemiesVariations = [
    0xff4444, // vermelho
    0x44ff44, // verde
    0x4444ff, // azul
    0xffff44, // amarelo
    0xff44ff, // magenta
    0x44ffff, // ciano
    0xff8844, // laranja
    0x8844ff, // roxo
    0x44ff88, // verde água
];

function spawnEnemies(){
    
    if (enemiesSpawned === true) return;
    
    for (let i = 0; i < qtdEnemiesSpawn; i++){

        const enemy = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 1),
            new THREE.MeshPhongMaterial({color: enemiesVariations[Math.floor(Math.random() * enemiesVariations.length)]})
        )
        enemy.castShadow = true;
        enemy.receiveShadow = true;

        enemy.userData.health = 3;
        enemy.userData.alive = true;

        let x = 0, z = 0;

        do{
            x = (Math.random() - 0.5) * 150;
            z = (Math.random() - 0.5) * 150;

        }while (Math.sqrt(x*x + z*z) < 20) //Define a posição para spawn de inimigo longe do player
        
        enemy.position.set(x, -0.135, z);

        // console.log(i);

        enemy.userData.attackCooldown = 0;

        scene.add(enemy);
        enemies.push(enemy);
        
    }

    enemiesSpawned = true;
}

const posEnemy = new THREE.Vector3();

function checkBulletEnemyCollision(bullet) {

    for (let j = 0; j < enemies.length; j++){

        const enemy = enemies[j];
        if (!enemy.userData.alive) continue;

        bullet.getWorldPosition(posBullet);
        enemy.getWorldPosition(posEnemy);

        const distance = posBullet.distanceTo(posEnemy);
        // console.log(distance);

        if (distance < 1.5) {
            return enemy; // ACHOU
        }
    }

    return null; // NÃO ACHOU

}

const posObstacle = new THREE.Vector3();

function checkBulletObstacleCollision(bullet){

    for (let j = 0; j < obstacles.length; j++){

        const obstacle = obstacles[j];

        bullet.getWorldPosition(posBullet);
        obstacle.getWorldPosition(posObstacle);

        const distance = posBullet.distanceTo(posObstacle);
        // console.log(distance);

        if (distance < 1.5) {
            return obstacle; // ACHOU
        }
    }

    return null; // NÃO ACHOU

}

const enemySpeed = 2;

function enemiesMove(deltaTime){

    if (enemiesSpawned === true){

        for (let i = 0; i < enemies.length; i++){
            const enemy = enemies[i];

            const lookTarget = new THREE.Vector3();
            lookTarget.copy(player.position);
            lookTarget.y = 0;

            enemy.lookAt(lookTarget);

            if (!enemy.userData.alive) continue;
            
            // Calcula a direção do inimigo para o player
            const directionPlayer = new THREE.Vector3();
            directionPlayer.subVectors(player.position, enemy.position);
            directionPlayer.y = 0; // Mantém movimento no plano horizontal
            directionPlayer.normalize(); // Transforma em vetor unitário (comprimento = 1)
            
            // Move o inimigo em direção ao player
            enemy.position.add(directionPlayer.multiplyScalar(enemySpeed * deltaTime));

            player.getWorldPosition(posPlayer);
            enemy.getWorldPosition(posEnemy);

            const distance = posEnemy.distanceTo(posPlayer);

            enemy.userData.attackCooldown += deltaTime * 2.5;

            if (distance < 1.5 && enemy.userData.attackCooldown >= 1){
                player.userData.health--;
                enemy.userData.attackCooldown = 0;
            }
        }
    }
}

const enemyDirection = new THREE.Vector3();
const enemyOrigin = new THREE.Vector3();

const enemyBullets = [];

function createBulletEnemy(enemy){

    const bulletCloneEnemy = enemyBullet.clone();

    enemy.getWorldDirection(enemyDirection);
    enemy.getWorldPosition(enemyOrigin);

    bulletCloneEnemy.position.copy(enemyOrigin);
    bulletCloneEnemy.direction = enemyDirection.clone().normalize();

    scene.add(bulletCloneEnemy);

    enemyBullets.push(bulletCloneEnemy);
}

const bulletEnemySpeed = 0.1;

function enemyShoot(deltaTime){

    // Atualiza cooldown e cria novas balas
    for (let i = 0; i < enemies.length; i++){

        const enemy = enemies[i];

        if (!enemy.userData.alive) continue;

        //Atribui a posição global do player e da bala para os vetores, 'posPlayer' e 'posBullet'
        player.getWorldPosition(posPlayer);
        enemy.getWorldPosition(posEnemy);

        //Calcula a distância do player para a bala e atribui a váriavel 'distancePlayerBullet'
        const distanceEnemyPlayer = posPlayer.distanceTo(posEnemy);

        enemy.userData.attackCooldown += deltaTime * 0.2;

        if (enemy.userData.attackCooldown > 2 && distanceEnemyPlayer > 30){
            createBulletEnemy(enemy);
            enemy.userData.attackCooldown = 0;
        }
    }

    // Move as balas já existentes
    for (let i = 0; enemyBullets.length > i; i++){

        enemyBullets[i].position.add(enemyBullets[i].direction.clone().multiplyScalar(bulletEnemySpeed));

        const hitPlayer = checkBulletPlayerCollision(enemyBullets[i]);
        const hitObstacle = checkBulletObstacleCollision(enemyBullets[i]);

        if (hitPlayer !== null) {
            player.userData.health--;

            scene.remove(enemyBullets[i]);
            enemyBullets.splice(i, 1);
            i--;

            continue;
        }

        if (hitObstacle !== null){

            scene.remove(enemyBullets[i]);
            enemyBullets.splice(i, 1);
            i--;

            continue;
        }
        

        //Atribui a posição global do player e da bala para os vetores, 'posPlayer' e 'posBullet'
        player.getWorldPosition(posPlayer);
        enemyBullets[i].getWorldPosition(posBullet);
        
        //Calcula a distância do player para a bala e atribui a váriavel 'distancePlayerBullet'
        const distancePlayerBullet = posPlayer.distanceTo(posBullet);
        
        //Se a bala estiver a 'despawnBulletDis' de distância do player ela é removida da cena
        if (distancePlayerBullet > despawnBulletDis){

            //Remove a bala da cena
            scene.remove(enemyBullets[i]);

            //Remove a bala da lista
            enemyBullets.splice(i, 1);
            i--;

            continue;
        }
    }
}

function checkBulletPlayerCollision(bullet){

    if (gameOver) return null;

    bullet.getWorldPosition(posBullet);
    player.getWorldPosition(posPlayer);

    const distance = posBullet.distanceTo(posPlayer);

    if (distance < 1.5) {
        return player; // ACHOU
    }

    return null; // NÃO ACHOU
}

const down = new THREE.Vector3(0, -1, 0);

let canJump = true;

const footOffset = new THREE.Vector3(0, 0.05, 0);

let onGroundBool = false;

function onGround() {

    player.getWorldPosition(origin.add(footOffset));

    raycaster.set(origin, down);

    const intersects = raycaster.intersectObject(scene.getObjectByName("ground"), true);
    // console.log(intersects);

    if (intersects.length > 0 && intersects[0].distance <= 1.1){
        canJump = true;
        onGroundBool = true;

    }else{
        canJump = false;
        onGroundBool = false;
    }

    // console.log(intersects[0].distance);
    // console.log(onGroundBool);
}

let rotationCimaLimite = false;
let rotationBaixoLimite = false;

function rotateX(){

    if (camera.rotation.x >= 0.6){
        rotationCimaLimite = true;

    }else{
        rotationCimaLimite = false;

    }

    if (camera.rotation.x <= -0.9){
        rotationBaixoLimite = true;
        
    }else{
        rotationBaixoLimite = false;
        
    }
    
}

let isPointerLock = false;

renderer.domElement.addEventListener("click", async () => {
    
    try{
        if (gameOver === false){
            await renderer.domElement.requestPointerLock();
        }

    } catch (e){
        //Cancelou o lock
    }

});

document.addEventListener("pointerlockchange", () =>{

    if (document.pointerLockElement === renderer.domElement){
        isPointerLock = true;

    }else{
        isPointerLock = false;
    }

});

let mouseX = 0;
let mouseY = 0;

window.addEventListener("mousemove", (event) => {

    if (!isPointerLock) return;

    //Rotaciona
    let rotateSpeed = 0.002;
    const step = 1000;

    const deltaY = mouseY * rotateSpeed;
    const deltaX = mouseX * rotateSpeed;

    if (isPointerLock === true){

        mouseX = event.movementX;
        mouseY = event.movementY;
    
        if (deltaY < 0 && rotationCimaLimite === true){
            return;
        }

        if (deltaY > 0 && rotationBaixoLimite === true){
            return;
        }

        camera.rotation.x -= deltaY;
        camera.rotation.x = Math.round(camera.rotation.x * step) / step;

        player.rotation.y -= deltaX;

    }

});

window.addEventListener("mousedown", (event) => {
    
    //Bala
    if (event.button === 0 && !event.repeat){
        bulletBool = true;
    }

});

window.addEventListener("mouseup", (event) => {

    //Bala
    if (event.button === 0 && !event.repeat){
        bulletBool = false;
    }

});

window.addEventListener("keydown", (event) => {

    //Mostra o menu de debug ao apertar F3//
    if (event.key === "F3" && event.shiftKey) {
        event.preventDefault();
        debug_ui.classList.toggle("hidden");
    }

    //Toggle a rotação do cubo//
    if (event.key === "F4" && debugAtivo === true){
        cubeRotation = !cubeRotation;
    }

    //Toggle a cor do cubo//
    if (event.key === "4" && debugAtivo === true){
        cubeColorRGB = !cubeColorRGB;
    }
    
    //Adiciona luz a bala do player//
    if (event.key === "5" && debugAtivo === true){
        bulletLight = !bulletLight;
    }

    //Recarrega a página//
    if (event.key.toLowerCase() === "r" && !event.repeat){
        location.reload();
    }

    //noClip Mode//
    if (event.key.toLowerCase() === "n" && debugAtivo === true){
        noClip = !noClip;
    }

    //WASD
    if (event.key.toLowerCase() === "w"){
        w = true;
    }
    if (event.key.toLowerCase() === "s"){
        s = true;
    }
    if (event.key.toLowerCase() === "a"){
        a = true;
    }
    if (event.key.toLowerCase() === "d"){
        d = true;
    }

    if(event.key === " "){
        space = true;
    }
    if (event.key === "Shift"){
        shift = true;
    }

});

window.addEventListener("keyup", (event) => {
    
    //WASD
    if (event.key.toLowerCase() === "w"){
        w = false;
    }
    if (event.key.toLowerCase() === "s"){
        s = false;
    }
    if (event.key.toLowerCase() === "a"){
        a = false;
    }
    if (event.key.toLowerCase() === "d"){
        d = false;
    }

    if(event.key === " "){
        space = false;
    }
    if (event.key === "Shift"){
        shift = false;
    }
    
});

update();