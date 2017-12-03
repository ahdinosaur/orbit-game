const Ecs = require('recs')
const Pixi = require('pixi.js')

var ecs = Ecs()

var app = new Pixi.Application(window.innerWidth, window.innerHeight, {
  transparent: true
})

app.renderer.autoResize = true

document.body.appendChild(app.view)

function Body () {
  this.mass = 0
  this.pos = new Pixi.Point(0, 0)
  this.vel = new Pixi.Point(0, 0)
  this.rot = 0
  this.rotVel = 0
}

function Sprite () {
  var sprite = new Pixi.Sprite()
  sprite.anchor.set(0.5)
  app.stage.addChild(sprite)
  return sprite
}

function Rocket () {
  this.power = 0.01
  this.active = false
}

function Playable () {
  this.keys = []
}

var Planet = [Body, Sprite]
var Ship = [Body, Sprite, Rocket, Playable]

ecs.entity(Planet, function (e) {
  e.body.mass = 1000
  e.body.pos.x = app.renderer.width / 2
  e.body.pos.y = app.renderer.height / 2

  const sprite = Pixi.Sprite.fromImage('images/planet.png')
  sprite.height = 100
  sprite.width = 100
  sprite.anchor.set(0.5)
  e.sprite.addChild(sprite)
})

ecs.entity(Ship, function (e) {
  e.body.mass = 1
  e.body.pos.x = app.renderer.width / 2
  e.body.pos.y = app.renderer.height / 4
  e.body.vel.x = 2
  e.body.vel.y = 0

  e.sprite.scale.x = 0.5
  e.sprite.scale.y = 0.5

  const sprite = Pixi.Sprite.fromImage('images/rocket.png')
  sprite.scale = new Pixi.Point(0.25, 0.25)
  sprite.anchor.set(0.5)
  e.sprite.addChild(sprite)

  e.body.rotVel = 0

  document.body.addEventListener('keydown', function (ev) {
    const index = e.playable.keys.indexOf(ev.key)
    if (!~index) e.playable.keys.push(ev.key)
  })
  document.body.addEventListener('keyup', function (ev) {
    const index = e.playable.keys.indexOf(ev.key)
    e.playable.keys.splice(index, 1)
  })
})


ecs.system([Body], function (d, delta) {
  d.body.pos.x += d.body.vel.x * delta
  d.body.pos.y += d.body.vel.y * delta
  d.body.rot += d.body.rotVel * delta
})

ecs.system([Body], [Body], function (a, b, delta) {
  var diff = new Pixi.Point(
    a.body.pos.x - b.body.pos.x,
    a.body.pos.y - b.body.pos.y
  )
  const len = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2)) + 0.0001
  const force = a.body.mass / Math.pow(len, 2)
  b.body.vel.x += force * (diff.x / len) * delta
  b.body.vel.y += force * (diff.y / len) * delta
})

ecs.system([Body, Sprite], function (e) {
  e.sprite.x = e.body.pos.x
  e.sprite.y = e.body.pos.y
  e.sprite.rotation = e.body.rot
})

ecs.system([Body, Rocket], function (e, delta) {
  if (e.rocket.active) {
    const thrust = e.rocket.power
    const direction = new Pixi.Point(
      Math.sin(e.body.rot),
      -Math.cos(e.body.rot)
    )
    e.body.vel.x += thrust * direction.x * delta
    e.body.vel.y += thrust * direction.y * delta
  }
})

ecs.system([Body, Playable], function (e) {
  const keys = e.playable.keys
  if (keys.includes('ArrowRight')) {
    e.body.rotVel += 0.002
  }
  if (keys.includes('ArrowLeft')) {
    e.body.rotVel -= 0.002
  }
  if (keys.includes('Enter') || keys.includes(' ')) {
    e.rocket.active = true
  } else {
    e.rocket.active = false
  }
})

app.ticker.add(function(delta) {
  ecs.tick(delta)
})
