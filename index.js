class Input {
    constructor(element) {
        this.keys = [];
        this.mouse = {
            down: false,
            x: 0,
            y: 0
        }
        element.addEventListener("keydown", (e) => { this.keys[e.keyCode] = true; });
        element.addEventListener("keyup", (e) => { this.keys[e.keyCode] = false; });
        element.addEventListener("mousedown", (e) => { this.mouse.down = true; });
        element.addEventListener("mouseup", (e) => { this.mouse.down = false; });
        element.addEventListener("mousemove", (e) => {
            this.mouse.x = e.clientX - canvas.getBoundingClientRect().left;
            this.mouse.y = e.clientY - canvas.getBoundingClientRect().top;
        })
    }
}

class Aabb {
    constructor(xa, ya, xb, yb) {
        this.xa = xa;
        this.ya = ya;
        this.xb = xb;
        this.yb = yb;
    }

    static colliding(a, b) {
        return !(a.xa > b.xb || a.xb < b.xa || a.ya > b.yb || a.yb < b.ya);
    }
}

class TextStation extends Aabb {
    constructor(xa, ya, xb, yb, text, img) {
        super(xa, ya, xb, yb);
        this.text = text;
        this.img = img;
    }

    render(ctx) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 6;
        ctx.drawImage(this.img, this.xa, this.ya, this.xb - this.xa, this.yb - this.ya);
    }
}

class NPC extends TextStation {
    constructor(x, y, text, image) {
        super(x, y, x + 64, y + 64, text, image);
    }
}

class Entity extends Aabb {
    constructor(x, y, w, h) {
        super(x, y, x + w, y + h);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    moveX(amt) {
        this.x += amt;
        this.xa = this.x;
        this.xb = this.x + this.w;
    }

    moveY(amt) {
        this.y += amt;
        this.ya = this.y;
        this.yb = this.y + this.h;
    }

    move(amtX, amtY) {
        this.moveX(amtX);
        this.moveY(amtY);
    }

    setX(x) {
        this.x = x;
        this.xa = this.x;
        this.xb = this.x + this.w;
    }

    setY(y) {
        this.y = y;
        this.ya = this.y;
        this.yb = this.y + this.h;
    }

    setPos(x, y) {
        this.setX(x);
        this.setY(y);
    }
}

class Player extends Entity {
    constructor(img, x, y, input, controls) {
        let w = 64;
        let h = 64;

        super(x, y, w, h);

        this.img = img;

        this.input = input;
        this.controls = controls;
        this.health = 10;

        this.bulletCooldown = 0;
    }

    update(delta) {
        const speed = 200;
        if (this.input.keys[this.controls.up]) this.moveY(-speed * delta);
        if (this.input.keys[this.controls.down]) this.moveY(speed * delta);
        if (this.input.keys[this.controls.left]) this.moveX(-speed * delta);
        if (this.input.keys[this.controls.right]) this.moveX(speed * delta);

        if (boss.phase === 4) {
            
            this.bulletCooldown -= delta;
            
            if (this.input.mouse.down && this.bulletCooldown <= 0) {
                let dx = this.input.mouse.x - player.x;
                let dy = this.input.mouse.y - player.y;
                let mag = Math.sqrt(dx * dx + dy * dy);
                dx /= mag;
                dy /= mag;

                bullets.push(new Bullet(images["bullet"], this.x, this.y, dx, dy, true));
                
                this.bulletCooldown = 0.5;
            }
        }
    }

    render(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
    }
}

class SceneTransition extends Aabb {
    constructor(xa, ya, xb, yb, targetScene, targetX, targetY) {
        super(xa, ya, xb, yb);
        this.targetScene = targetScene;
        this.targetX = targetX;
        this.targetY = targetY;
    }
}

class SceneTransitionLeft extends SceneTransition {
    constructor(targetScene) {
        super(-100, 0, 0, 512, targetScene, 512 - 64 - 1, undefined);
    }
}

class SceneTransitionRight extends SceneTransition {
    constructor(targetScene) {
        super(512, 0, 612, 512, targetScene, 1, undefined);
    }
}

class SceneTransitionTop extends SceneTransition {
    constructor(targetScene) {
        super(0, -100, 512, 0, targetScene, undefined, 512 - 64 - 1);
    }
}

class SceneTransitionBottom extends SceneTransition {
    constructor(targetScene) {
        super(0, 512, 512, 612, targetScene, undefined, 1);
    }
}

class Scene {
    constructor(tiles) {
        this.tiles = tiles;
        this.transitions = [];
        this.textStations = [];
    }

    addSceneTransition(transition) {
        this.transitions.push(transition);
    }

    addTextStation(textStation) {
        this.textStations.push(textStation);
    }

    setTile(x, y, tile) {
        this.tiles[y][x] = tile;
    }

    getTile(x, y) {
        return this.tiles[y][x];
    }
}

class Bullet extends Entity {
    constructor(img, x, y, dx, dy, playerOwned) {
        super(x, y, 32, 32);
        this.img = img;
        this.dx = dx;
        this.dy = dy;
        this.playerOwned = playerOwned;
        this.speed = 250;
        this.hit = false;
    }

    update(delta) {
        this.move(this.dx * delta * this.speed, this.dy * delta * this.speed);
    }

    render(ctx) {
        ctx.drawImage(this.img, this.x, this.y, 32, 32);
    }
}

class Boss extends Entity {
    constructor(img, x, y) {
        super(x, y, 64, 64);

        this.img = img;
        this.phase = 0;
        this.changeTarget();
        this.lastChangeTarget = 0;
        this.lastBulletShoot = 0;
        this.health = 10;
    }

    update(delta) {
        switch (this.phase) {
            case 0:
                if (player.x < 512 - 128) {
                    console.log("Initiating boss fight");
                    this.phase = 1;
                    closeBossDoors();
                    setTimeout(() => { this.phase = 2 }, 1000);
                }
                break;
            case 2:
                setFeedbackText("I am Steven Mnuchin! You think you can defeat me? Nobody can challenge me with money on my side!<br><br>Click to shoot!<br><br>Your HP - <span id='player-hp'>" + player.health + "</span><br>Mnuchin's HP - <span id='mnuchin-hp'>" + this.health + "</span>");
                this.phase = 3;
                setTimeout(() => { this.phase = 4 }, 5000);
                break;
            case 4:
                this.updateFight(delta);
                if (this.health <= 0) this.phase = 5;
                break;
            case 5:
                setFeedbackText("Oh no! You've defeated me and my money! Bleh");
                this.dieX = this.x;
                this.timeSinceDeath = 0;
                openBossDoors();
                this.phase = 6;
                break;
            case 6:
                this.timeSinceDeath += delta;
                this.x = Math.sin(this.timeSinceDeath * 5) * 50 + this.dieX;
                this.y -= 300 * delta;
                break;
        }
    }

    updateFight(delta) {
        document.getElementById("player-hp").innerHTML = player.health;
        document.getElementById("mnuchin-hp").innerHTML = this.health;
        
        this.lastChangeTarget += delta;
        if (this.lastChangeTarget >= 1) {
            this.lastChangeTarget = 0;
            this.changeTarget();
            this.lastBulletShoot++;
        }

        if (this.lastBulletShoot >= 1) {
            this.lastBulletShoot = 0;
            this.shootBullet();
        }

        this.setPos(
            lerp(this.x, this.tgtX, delta),
            lerp(this.y, this.tgtY, delta)
        );
    }

    shootBullet() {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let mag = Math.sqrt(dx * dx + dy * dy);
        dx /= mag;
        dy /= mag;

        bullets.push(new Bullet(images["bullet"], this.x, this.y, dx, dy, false));
    }

    changeTarget() {
        this.tgtX = Math.random() * 5 * 64 + 64;
        this.tgtY = Math.random() * 5 * 64 + 64;
    }

    render(ctx) {
        ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
    }
}

const canvas = document.getElementById("c");
const ctx = c.getContext("2d");

ctx.imageSmoothingEnabled = false;

let input = new Input(document);

let imgsLoaded = 0;
let imgsToLoad = 0;
let imagesReady = false;
let images = {};
let scenes = {};
let currentScene = undefined;
let bullets = [];

function loadImage(name) {
    imgsToLoad++;
    console.log("Loading image: " + name);
    let img = new Image();
    img.src = "img/" + name + ".png";
    img.onload = () => { imgsLoaded++; console.log("Successfully loaded image: " + name); if (imagesReady && imgsLoaded === imgsToLoad) run(); }
    images[name] = img;
}

function setImagesReady() {
    imagesReady = true;
    if (imgsLoaded === imgsToLoad) run();
}

function setFeedbackText(text) {
    document.getElementById("feedback-text").innerHTML = text;
}

function clearFeedbackText() {
    setFeedbackText("");
}

loadImage("scarab");
loadImage("brick");
loadImage("floor");
loadImage("npc");
loadImage("mnuchin");
loadImage("lock");
loadImage("bullet");
loadImage("sources");
loadImage("npc1");
loadImage("npc2");
loadImage("npc3");
loadImage("npc4");
loadImage("npc5");
loadImage("npc6");

setImagesReady();

let player = new Player(images["scarab"], 0, 0, input, {
    up: 87,
    down: 83,
    left: 65,
    right: 68
});

let boss = new Boss(images["mnuchin"], 256 - 32, 256 - 32);

function addScene(name, scene) {
    scenes[name] = scene;
    return scene;
}

function setCurrentScene(name, playerX, playerY) {
    currentScene = scenes[name];
    player.setPos(playerX, playerY);
    bullets = [];
    console.log("Setting scene: " + name);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function closeBossDoors() {
    currentScene.setTile(0, 2, 3);
    currentScene.setTile(0, 3, 3);
    currentScene.setTile(0, 4, 3);
    currentScene.setTile(0, 5, 3);
    currentScene.setTile(7, 2, 3);
    currentScene.setTile(7, 3, 3);
    currentScene.setTile(7, 4, 3);
    currentScene.setTile(7, 5, 3);
}

function openBossDoors() {
    currentScene.setTile(0, 2, 0);
    currentScene.setTile(0, 3, 0);
    currentScene.setTile(0, 4, 0);
    currentScene.setTile(0, 5, 0);
    currentScene.setTile(7, 2, 0);
    currentScene.setTile(7, 3, 0);
    currentScene.setTile(7, 4, 0);
    currentScene.setTile(7, 5, 0);
}

function die() {
    console.log(document.getElementById("death-screen"));
    document.getElementById("death-screen").classList.remove("hidden");
}

function run() {   
    let startScene = addScene("start", new Scene([
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
    ]));
    startScene.addSceneTransition(new SceneTransitionRight("hall_1"));
    startScene.addTextStation(new NPC(128, 128, "Go through the hall and find the facts", images["npc1"]));

    let hallScene1 = addScene("hall_1", new Scene([
        [2, 2, 2, 2, 2, 2, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [2, 2, 2, 2, 2, 2, 2, 2],
    ]));
    hallScene1.addSceneTransition(new SceneTransitionLeft("start"));
    hallScene1.addSceneTransition(new SceneTransitionRight("hall_2"));
    hallScene1.addTextStation(new NPC(256 - 32, 128, "This is Steven Mnuchin's lair. You must defeat him!", images["npc2"]));

    let hallScene2 = addScene("hall_2", new Scene([
        [2, 2, 2, 2, 2, 2, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [2, 2, 2, 2, 2, 2, 2, 2],
    ]));
    hallScene2.addSceneTransition(new SceneTransitionLeft("hall_1"));
    hallScene2.addSceneTransition(new SceneTransitionRight("hall_3"));
    hallScene2.addTextStation(new NPC(256 - 32, 128, "Steven Mnuchin is the Secretary of Treasury. His job is to keep the economy strong, create job opportunities, and protect against economic threats.<br><br>I also think he should be tasked with improving spending efficiency to help shrink that monstrous debt.", images["npc3"]));

    let hallScene3 = addScene("hall_3", new Scene([
        [2, 1, 0, 0, 0, 0, 1, 2],
        [1, 1, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 0, 0, 1, 2],
        [1, 1, 1, 1, 1, 1, 1, 2],
        [2, 2, 2, 2, 2, 2, 2, 2],
    ]));
    hallScene3.addSceneTransition(new SceneTransitionLeft("hall_2"));
    hallScene3.addSceneTransition(new SceneTransitionTop("hall_4"));
    hallScene3.addTextStation(new NPC(512 - 256, 512 - 256, "Would I have hired Mnuchin for the job? Probably not. He was an actor before, how's that for qualifications? And he also ran a sketchy bank that's been in trouble with the law. Not to mention, he was sued by Donald Trump himself regarding a loan for a Trump Tower.<br><br>In my opinion, the Secretary of Treasury should have more experience with low paying jobs in order to sympathize with less fortunate people. They also should have a good legal standing, something which Mnuchin lacks. There is a lot of conflict of interests with him.", images["npc4"]));

    let hallScene4 = addScene("hall_4", new Scene([
        [2, 1, 0, 0, 0, 0, 1, 2],
        [2, 1, 0, 0, 0, 0, 1, 2],
        [2, 1, 0, 0, 0, 0, 1, 2],
        [2, 1, 0, 0, 0, 0, 1, 2],
        [2, 1, 0, 0, 0, 0, 1, 2],
        [2, 1, 0, 0, 0, 0, 1, 2],
        [2, 1, 0, 0, 0, 0, 1, 2],
        [2, 1, 0, 0, 0, 0, 1, 2],
    ]));
    hallScene4.addSceneTransition(new SceneTransitionBottom("hall_3"));
    hallScene4.addSceneTransition(new SceneTransitionTop("hall_5"));
    hallScene4.addTextStation(new NPC(300, 100, "Mnuchin's grandfather was a diamond dealer. His father worked at Goldman Sachs, and so did he. His family has been rich for a long time, and he does jobs involving money because it's all he's ever known.<br><br>Mnuchin's wife is Louise Linton, who has also lived a privileged life. Everyone close to him is rich.", images["npc5"]));

    let hallScene5 = addScene("hall_5", new Scene([
        [2, 2, 2, 2, 2, 2, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 2],
        [0, 0, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 0, 0, 1, 2],
        [1, 1, 0, 0, 0, 0, 1, 2],
        [2, 1, 0, 0, 0, 0, 1, 2],
    ]));
    hallScene5.addSceneTransition(new SceneTransitionBottom("hall_4"));
    hallScene5.addSceneTransition(new SceneTransitionLeft("boss"));
    hallScene5.addTextStation(new NPC(512 - 270, 270, "The previous Secretary of the Treasury was Jack Lew. He wasn't there for very long and didn't do much. He no longer works for the government.<br><br>The only reason that Mnuchin is Secretary of the Treasury now is because he was a lobbyist for Trump's presidential campaign.", images["npc6"]));

    let bossScene = addScene("boss", new Scene([
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
    ]));
    bossScene.addSceneTransition(new SceneTransitionRight("hall_5"));
    bossScene.addSceneTransition(new SceneTransitionLeft("prison"));

    let prisonScene = addScene("prison", new Scene([
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
    ]));
    prisonScene.addSceneTransition(new SceneTransitionRight("boss"));
    prisonScene.addTextStation(new NPC(256 - 32, 256 - 32, "You saved me! I was thrown in here because I thought a different person would be good Secretary of the Treasury - Elon Musk. Now I know that sounds generic, but hear me out. Elon Musk is clearly good with money, as he's the 40th richest person in the world. But he's also been at the other end of the spectrum and experienced what it's like to live a hard life. He cares about creating job opportunities and making the world a better place.<br><br>Oops, I'm rambling. Well, now that I'm saved, let's get out of here!<br><br><br>The end!", images["npc"]));
    prisonScene.addTextStation(new NPC(64, 64, "<span style='font-size:16px'>https://www.democracynow.org/2017/2/14/headlines/senate_confirms_steven_mnuchin_to_be_treasury_secretary<br>https://www.whitehouse.gov/people/steven-mnuchin/<br>https://ballotpedia.org/Steven_Mnuchin<br>https://theintercept.com/2017/01/03/treasury-nominee-steve-mnuchins-bank-accused-of-widespread-misconduct-in-leaked-memo/<br>https://en.wikipedia.org/wiki/Steven_Mnuchin<br></span>", images["sources"]));

    setCurrentScene("start", 256 - 32, 256 - 32);

    function loop() {
        update(1 / 60);
        render();
    }

    function update(delta) {
        player.update(delta);

        let playerTileX = Math.round(player.x / 64);
        let playerTileY = Math.round(player.y / 64);

        let cx = playerTileX;
        let cy = playerTileY;
        let l = cx - 1;
        let r = cx + 1;
        let t = cy - 1;
        let b = cy + 1;

        if (l >= 0 && l < 8 && currentScene.getTile(l, cy) != 0) player.setX(Math.max(player.x, playerTileX * 64));
        if (r >= 0 && r < 8 && currentScene.getTile(r, cy) != 0) player.setX(Math.min(player.x, playerTileX * 64));
        if (t >= 0 && t < 8 && currentScene.getTile(cx, t) != 0) player.setY(Math.max(player.y, playerTileY * 64));
        if (b >= 0 && b < 8 && currentScene.getTile(cx, b) != 0) player.setY(Math.min(player.y, playerTileY * 64));

        for (let i in currentScene.transitions) {
            if (Aabb.colliding(player, currentScene.transitions[i])) {
                let transition = currentScene.transitions[i];
                let newPlayerX = transition.targetX === undefined ? player.x : transition.targetX;
                let newPlayerY = transition.targetY === undefined ? player.y : transition.targetY;
                setCurrentScene(currentScene.transitions[i].targetScene, newPlayerX, newPlayerY);
                break;
            }
        }

        for (let i in currentScene.textStations) {
            let station = currentScene.textStations[i];
            if (Aabb.colliding(player, station)) {
                setFeedbackText(station.text);
            }
        }

        if (currentScene === scenes["boss"]) {
            boss.update(delta);

            for (let i = 0; i < bullets.length; i++) {
                
                let bullet = bullets[i];
                
                bullet.update(delta);

                if (bullet.playerOwned) {
                    if (!bullet.hit && Aabb.colliding(bullet, boss)) {
                        bullet.hit = true;
                        boss.health--;
                    }
                } else {
                    if (!bullet.hit && Aabb.colliding(bullet, player)) {
                        bullet.hit = true;
                        player.health--;
                    }
    
                    if (bullet.x < -100 || bullet.y < -100 || bullet.x > 612 || bullet.y > 612) {
                        bullets.splice(i, 1);
                        i--;
                        console.log("bullet despawned");
                    }
                }
            }
        }
    }

    function render() {
        ctx.clearRect(0, 0, c.width, c.height);

        renderTiles(ctx, currentScene.tiles);
        for (let i in currentScene.textStations) {
            currentScene.textStations[i].render(ctx);
        }

        if (currentScene === scenes["boss"]) {
            boss.render(ctx);
        }

        player.render(ctx);

        renderTransitions(ctx);
        //renderTransitionsDebug(ctx);

        for (let i in bullets) {
            bullets[i].render(ctx);
        }

        if (player.health > 0) requestAnimationFrame(loop);
        else {
            die();
        }
    }

    function renderTransitions(ctx) {
        for (let i in currentScene.transitions) {
            let t = currentScene.transitions[i];
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#ffffff";
            ctx.strokeRect(t.xa, t.ya, t.xb - t.xa, t.yb - t.ya);
        }
    }

    function renderTransitionsDebug(ctx) {
        for (let i in currentScene.transitions) {
            let t = currentScene.transitions[i];
            ctx.strokeStyle = "#000000";
            ctx.strokeRect(t.xa, t.ya, t.xb - t.xa, t.yb - t.ya);
            ctx.strokeStyle = "#ff0000";
            ctx.strokeRect(t.xa - 50, t.ya - 50, t.xb - t.xa + 100, t.yb - t.ya + 100);
        }
    }

    function renderTiles(ctx, tiles) {
        for (let y = 0; y < tiles.length; y++) {
            for (let x = 0; x < tiles[y].length; x++) {
                renderTile(ctx, tiles, x, y);
            }
        }
    }

    function renderTile(ctx, tiles, x, y) {
        const scale = 64;
        switch (tiles[y][x]) {
            case 0:
                ctx.drawImage(images["floor"], x * scale, y * scale, scale, scale);
                break;

            case 1:
                ctx.drawImage(images["brick"], x * scale, y * scale, scale, scale);
                break;

            case 2:
                ctx.fillStyle = "#000000";
                ctx.fillRect(x * scale, y * scale, scale, scale);
                break;

            case 3:
                ctx.drawImage(images["lock"], x * scale, y * scale, scale, scale);
                break;
        }
    }

    requestAnimationFrame(loop);
}

