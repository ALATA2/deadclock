/**
 * DEAD O'CLOCK: Input Manager
 * Handles Keyboard, Mouse (with Pointer Lock) and Virtual Touchscreen Controls.
 */

export class InputManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.keys = {};
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.isPointerLocked = false;
    this.mouseSensitivity = 0.0025;
    this.mouseClicked = false;
    this.usePressed = false;

    // Action states
    this.actions = {
      forward: false,
      backward: false,
      strafeLeft: false,
      strafeRight: false,
      turnLeft: false,
      turnRight: false,
      run: false,
      attack: false,
      use: false,
      weaponNext: false,
      weaponPrev: false,
      weaponSlot: null,
      toggleMap: false,
      toggleDebug: false,
      pause: false
    };

    // Touch controls state
    this.touchEnabled = false;
    this.touchJoystick = { active: false, id: null, startX: 0, startY: 0, curX: 0, curY: 0, dx: 0, dy: 0 };
    this.touchLook = { active: false, id: null, lastX: 0, dx: 0 };

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      // Handle direct key triggers
      if (e.code === "KeyM") this.actions.toggleMap = true;
      if (e.code === "F3") {
        e.preventDefault();
        this.actions.toggleDebug = true;
      }
      if (e.code === "Escape") this.actions.pause = true;

      // Weapon slots 1 to 5
      if (["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].includes(e.code)) {
        this.actions.weaponSlot = parseInt(e.code.replace("Digit", ""), 10) - 1;
      }

      if (e.code === "KeyE" || e.code === "Space") {
        this.actions.use = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener("wheel", (e) => {
      if (e.deltaY < 0) this.actions.weaponPrev = true;
      if (e.deltaY > 0) this.actions.weaponNext = true;
    });

    // Pointer Lock
    this.canvas.addEventListener("click", () => {
      if (!this.isPointerLocked && !this.touchEnabled) {
        this.canvas.requestPointerLock?.();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener("mousemove", (e) => {
      if (this.isPointerLocked) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    });

    window.addEventListener("mousedown", (e) => {
      if (e.button === 0 && this.isPointerLocked) {
        this.actions.attack = true;
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this.actions.attack = false;
      }
    });

    // Touch events for Mobile
    this._setupTouch();
  }

  _setupTouch() {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
    if (isMobileDevice) {
      this.touchEnabled = true;
    }
  }

  update() {
    // Keyboard mapping
    this.actions.forward = !!(this.keys["KeyW"] || this.keys["ArrowUp"]);
    this.actions.backward = !!(this.keys["KeyS"] || this.keys["ArrowDown"]);
    this.actions.strafeLeft = !!(this.keys["KeyA"]);
    this.actions.strafeRight = !!(this.keys["KeyD"]);
    this.actions.turnLeft = !!(this.keys["ArrowLeft"]);
    this.actions.turnRight = !!(this.keys["ArrowRight"]);
    this.actions.run = !!(this.keys["ShiftLeft"] || this.keys["ShiftRight"]);

    if (this.keys["ControlLeft"] || this.keys["ControlRight"]) {
      this.actions.attack = true;
    }

    // Touch joystick mapping
    if (this.touchJoystick.active) {
      if (this.touchJoystick.dy < -0.3) this.actions.forward = true;
      if (this.touchJoystick.dy > 0.3) this.actions.backward = true;
      if (this.touchJoystick.dx < -0.3) this.actions.strafeLeft = true;
      if (this.touchJoystick.dx > 0.3) this.actions.strafeRight = true;
    }
  }

  getTurnDelta() {
    let delta = 0;
    if (this.actions.turnLeft) delta -= 0.05;
    if (this.actions.turnRight) delta += 0.05;

    if (this.mouseDX !== 0) {
      delta += this.mouseDX * this.mouseSensitivity;
      this.mouseDX = 0;
    }

    if (this.touchLook.dx !== 0) {
      delta += this.touchLook.dx * this.mouseSensitivity * 1.5;
      this.touchLook.dx = 0;
    }

    return delta;
  }

  consumeAction(actionName) {
    const val = this.actions[actionName];
    this.actions[actionName] = false;
    return val;
  }

  consumeWeaponSlot() {
    const val = this.actions.weaponSlot;
    this.actions.weaponSlot = null;
    return val;
  }
}
