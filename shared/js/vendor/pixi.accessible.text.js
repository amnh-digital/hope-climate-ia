class AccessibleText extends PIXI.Text {
  constructor(view, text, style, canvas) {
    super(text, style, canvas);

    this.initContainer(view);
  }

  static addClass(el, className) {
    if (el.classList) el.classList.add(className);
    else if (!hasClass(el, className)) el.className += ' ' + className;
  }

  static getChildByClassname(el, className) {
    return el.getElementsByClassName(className)[0];
  }

  static hasClass(el, className) {
    return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
  }

  get height() {
    return this.el.offsetHeight;
  }

  get width() {
    return this.el.offsetWidth;
  }

  initContainer(view){
    var parentNode = view.parentNode;
    var wrapperClassname = "pixi-text-wrapper";
    var textCanvasClassname = "pixi-text-canvas";
    var __ = AccessibleText

    // wrap canvas in wrapper and add text container if it doesn't exist
    if (!__.hasClass(parentNode, wrapperClassname)) {
      // add wrapper
      var wrapper = document.createElement('div');
      parentNode.insertBefore(wrapper, view);
      wrapper.appendChild(view);
      __.addClass(wrapper, wrapperClassname);
      wrapper.setAttribute("style", "position: relative; display: inline-block;");
      parentNode = wrapper;
      // add text canvas
      var canvas = document.createElement('div');
      __.addClass(canvas, textCanvasClassname);
      canvas.setAttribute("style", "position: absolute; width: 100%; height: 100%; left: 0; top: 0;");
      wrapper.appendChild(canvas);
    }

    // create this text element
    var textCanvas = __.getChildByClassname(parentNode, textCanvasClassname);
    var textEl = document.createElement('div');
    textEl.innerHTML = this.text;
    textEl.setAttribute("style", "position: absolute; left: 0; top: 0;");
    textCanvas.appendChild(textEl);

    this.wrapper = parentNode;
    this.textCanvas = textCanvas;
    this.el = textEl;

    // console.log(textCanvas.offsetWidth, textCanvas.offsetHeight)
  }

  updateStyleAttributes() {
    var pstyle = this._style;
    var alpha = this.alpha;

    // console.log(pstyle);
    var styles = [
      ["position", "absolute"],
      ["top", 0],
      ["left", 0],
      ["color", pstyle._fill],
      ["font-family", pstyle._fontFamily],
      ["font-size", pstyle._fontSize+"px"],
      ["font-style", pstyle._fontStyle],
      ["font-weight", pstyle._fontWeight],
      ["opacity", alpha],
      ["padding", pstyle._padding],
      ["text-align", pstyle._align]
    ];
    if (pstyle._wordWrap) {
      styles.push(
        ["width", pstyle._wordWrapWidth+"px"],
        ["white-space", "normal"]
      );
    } else styles.push(["white-space", pstyle._whiteSpace]);

    if (pstyle._lineHeight) styles.push(["line-height", pstyle._lineHeight+"px"]);
    if (pstyle._letterSpacing) styles.push(["letter-spacing", pstyle._letterSpacing]);

    styles = styles.map(function callback(tuple) { return tuple.join(": "); });
    styles = styles.join("; ") + ";";
    this.el.setAttribute("style", styles);
  }

  updateText(respectDirty) {
    // PIXI.Text.prototype.updateText.call(this, respectDirty);
    var style = this._style;
    var styleChanged = (this.localStyleID !== style.styleID);

    // check if style has changed..
    if (styleChanged) {
      this.dirty = true;
      this.localStyleID = style.styleID;
    }

    // don't do anything if nothing has changed
    if (!this.dirty && respectDirty) return;

    // must be done in this order to calculate properties properly
    this.el.innerHTML = this.text;
    if (styleChanged) this.updateStyleAttributes();
    this.updateTransform();

    this.dirty = false;
  }

  updateTransform(){
    var x = this.x;
    var y = this.y;
    var anchorX = this.anchor.x;
    var anchorY = this.anchor.y;

    if (anchorX > 0) {
      // console.log(x, this.el.offsetWidth)
      x -= this.width * anchorX;
    }
    if (anchorY > 0) {
      // console.log(y, this.el.offsetHeight)
      y -= this.height * anchorY;
    }
    this.el.style.transform = "translate3d("+x+"px, "+y+"px, 0)";
    if (anchorX===0.5) this.el.style.textAlign = "center";
    if (anchorX>=1.0) this.el.style.textAlign = "right";
  }

}
