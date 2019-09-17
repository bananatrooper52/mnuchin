class Input {
    constructor(element) {
        this.keys = [];
        element.addEventListener("keydown", (e) => { this.keys[e.keyCode] = true; });
        element.addEventListener("keyup", (e) => { this.keys[e.keyCode] = false; });
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
    constructor(xa, ya, xb, yb, text) {
        super(xa, ya, xb, yb);
        this.text = text;
    }

    render(ctx) { 
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 6;
        ctx.strokeRect(this.xa, this.ya, this.xb - this.xa, this.yb - this.ya);
    }
}

class Player extends Aabb {
    constructor(img, x, y, input, controls) {
        let w = 64;
        let h = 64;

        super(x, y, x + w, y + h);

        this.img = img;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.input = input;
        this.controls = controls;
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

    update(delta) {
        const speed = 200;
        if (this.input.keys[this.controls.up]) this.moveY(-speed * delta);
        if (this.input.keys[this.controls.down]) this.moveY(speed * delta);
        if (this.input.keys[this.controls.left]) this.moveX(-speed * delta);
        if (this.input.keys[this.controls.right]) this.moveX(speed * delta);
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

const canvas = document.getElementById("c");
const ctx = c.getContext("2d");

ctx.imageSmoothingEnabled = false;

let input = new Input(document);

let images = {};
let scenes = {};
let currentScene = undefined;

function loadImage(name) {
    let img = new Image();
    img.src = "img/" + name + ".png";
    images[name] = img;
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

let player = new Player(images["scarab"], 0, 0, input, {
    up: 87,
    down: 83,
    left: 65,
    right: 68
});

function addScene(name, scene) {
    scenes[name] = scene;
    return scene;
}

function setCurrentScene(name, playerX, playerY) {
    currentScene = scenes[name];
    player.setPos(playerX, playerY);
    console.log("Setting scene: " + name);
}

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
startScene.addSceneTransition(new SceneTransition(512, 128, 520, 384, "hall_1", 1, undefined));
startScene.addTextStation(new TextStation(128, 128, 128+64, 128+64, "Go through the hall and find the facts"));

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
hallScene1.addSceneTransition(new SceneTransition(-10, 0, 0, 512, "start", 512-64-1, undefined));
hallScene1.addTextStation(new TextStation(256-32, 128, 256+32, 128+64, "This is Steven Mnuchin's lair. You must defeat him!"))

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
hallScene2.addSceneTransition(new SceneTransition(-10, 0, 0, 512, "start", 512-64-1, undefined));
hallScene2.addTextStation(new TextStation(256-32, 128, 256+32, 128+64, "This is Steven Mnuchin's lair. You must defeat him!"))

setCurrentScene("start", 256-32, 256-32);

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

    if (currentScene.getTile(l, cy) != 0) player.setX(Math.max(player.x, playerTileX * 64));
    if (currentScene.getTile(r, cy) != 0) player.setX(Math.min(player.x, playerTileX * 64));
    if (currentScene.getTile(cx, t) != 0) player.setY(Math.max(player.y, playerTileY * 64));
    if (currentScene.getTile(cx, b) != 0) player.setY(Math.min(player.y, playerTileY * 64));

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
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    renderTiles(ctx, currentScene.tiles);
    for (let i in currentScene.textStations) {
        currentScene.textStations[i].render(ctx);
    }
    player.render(ctx);

    //renderTransitionsDebug(ctx);

    requestAnimationFrame(loop);
}

function renderTransitionsDebug(ctx) {
    for (let i in currentScene.transitions) {
        let t = currentScene.transitions[i];
        ctx.strokeStyle = "#000000";
        ctx.strokeRect(t.xa, t.ya, t.xb - t.xa, t.yb - t.ya);
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
    }
}

requestAnimationFrame(loop);