(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.MultiStyleText = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require("./pixi-multistyle-text").default;
},{"./pixi-multistyle-text":2}],2:[function(require,module,exports){
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var INTERACTION_EVENTS = [
        "pointerover",
        "pointerenter",
        "pointerdown",
        "pointermove",
        "pointerup",
        "pointercancel",
        "pointerout",
        "pointerleave",
        "gotpointercapture",
        "lostpointercapture",
        "mouseover",
        "mouseenter",
        "mousedown",
        "mousemove",
        "mouseup",
        "mousecancel",
        "mouseout",
        "mouseleave",
        "touchover",
        "touchenter",
        "touchdown",
        "touchmove",
        "touchup",
        "touchcancel",
        "touchout",
        "touchleave"
    ];
    var MultiStyleText = (function (_super) {
        __extends(MultiStyleText, _super);
        function MultiStyleText(text, styles) {
            var _this = _super.call(this, text) || this;
            _this.styles = styles;
            INTERACTION_EVENTS.forEach(function (event) {
                _this.on(event, function (e) { return _this.handleInteraction(e); });
            });
            return _this;
        }
        MultiStyleText.prototype.handleInteraction = function (e) {
            var ev = e;
            var localPoint = e.data.getLocalPosition(this);
            var targetTag = this.hitboxes.reduce(function (prev, hitbox) { return prev !== undefined ? prev : (hitbox.hitbox.contains(localPoint.x, localPoint.y) ? hitbox : undefined); }, undefined);
            ev.targetTag = targetTag === undefined ? undefined : targetTag.tag;
        };
        Object.defineProperty(MultiStyleText.prototype, "styles", {
            set: function (styles) {
                this.textStyles = {};
                this.textStyles["default"] = this.assign({}, MultiStyleText.DEFAULT_TAG_STYLE);
                for (var style in styles) {
                    if (style === "default") {
                        this.assign(this.textStyles["default"], styles[style]);
                    }
                    else {
                        this.textStyles[style] = this.assign({}, styles[style]);
                    }
                }
                this._style = new PIXI.TextStyle(this.textStyles["default"]);
                this.dirty = true;
            },
            enumerable: true,
            configurable: true
        });
        MultiStyleText.prototype.setTagStyle = function (tag, style) {
            if (tag in this.textStyles) {
                this.assign(this.textStyles[tag], style);
            }
            else {
                this.textStyles[tag] = this.assign({}, style);
            }
            this._style = new PIXI.TextStyle(this.textStyles["default"]);
            this.dirty = true;
        };
        MultiStyleText.prototype.deleteTagStyle = function (tag) {
            if (tag === "default") {
                this.textStyles["default"] = this.assign({}, MultiStyleText.DEFAULT_TAG_STYLE);
            }
            else {
                delete this.textStyles[tag];
            }
            this._style = new PIXI.TextStyle(this.textStyles["default"]);
            this.dirty = true;
        };
        MultiStyleText.prototype.getTagRegex = function (captureName, captureMatch) {
            var tagAlternation = Object.keys(this.textStyles).join("|");
            if (captureName) {
                tagAlternation = "(" + tagAlternation + ")";
            }
            else {
                tagAlternation = "(?:" + tagAlternation + ")";
            }
            var reStr = "<" + tagAlternation + "(?:\\s+[A-Za-z0-9_\\-]+=(?:\"(?:[^\"]+|\\\\\")*\"|'(?:[^']+|\\\\')*'))*\\s*>|</" + tagAlternation + "\\s*>";
            if (captureMatch) {
                reStr = "(" + reStr + ")";
            }
            return new RegExp(reStr, "g");
        };
        MultiStyleText.prototype.getPropertyRegex = function () {
            return new RegExp("([A-Za-z0-9_\\-]+)=(?:\"((?:[^\"]+|\\\\\")*)\"|'((?:[^']+|\\\\')*)')", "g");
        };
        MultiStyleText.prototype._getTextDataPerLine = function (lines) {
            var outputTextData = [];
            var re = this.getTagRegex(true, false);
            var styleStack = [this.assign({}, this.textStyles["default"])];
            var tagStack = [{ name: "default", properties: {} }];
            for (var i = 0; i < lines.length; i++) {
                var lineTextData = [];
                var matches = [];
                var matchArray = void 0;
                while (matchArray = re.exec(lines[i])) {
                    matches.push(matchArray);
                }
                if (matches.length === 0) {
                    lineTextData.push(this.createTextData(lines[i], styleStack[styleStack.length - 1], tagStack[tagStack.length - 1]));
                }
                else {
                    var currentSearchIdx = 0;
                    for (var j = 0; j < matches.length; j++) {
                        if (matches[j].index > currentSearchIdx) {
                            lineTextData.push(this.createTextData(lines[i].substring(currentSearchIdx, matches[j].index), styleStack[styleStack.length - 1], tagStack[tagStack.length - 1]));
                        }
                        if (matches[j][0][1] === "/") {
                            if (styleStack.length > 1) {
                                styleStack.pop();
                                tagStack.pop();
                            }
                        }
                        else {
                            styleStack.push(this.assign({}, styleStack[styleStack.length - 1], this.textStyles[matches[j][1]]));
                            var properties = {};
                            var propertyRegex = this.getPropertyRegex();
                            var propertyMatch = void 0;
                            while (propertyMatch = propertyRegex.exec(matches[j][0])) {
                                properties[propertyMatch[1]] = propertyMatch[2] || propertyMatch[3];
                            }
                            tagStack.push({ name: matches[j][1], properties: properties });
                        }
                        currentSearchIdx = matches[j].index + matches[j][0].length;
                    }
                    if (currentSearchIdx < lines[i].length) {
                        lineTextData.push(this.createTextData(lines[i].substring(currentSearchIdx), styleStack[styleStack.length - 1], tagStack[tagStack.length - 1]));
                    }
                }
                outputTextData.push(lineTextData);
            }
            return outputTextData;
        };
        MultiStyleText.prototype.getFontString = function (style) {
            return new PIXI.TextStyle(style).toFontString();
        };
        MultiStyleText.prototype.createTextData = function (text, style, tag) {
            return {
                text: text,
                style: style,
                width: 0,
                height: 0,
                fontProperties: undefined,
                tag: tag
            };
        };
        MultiStyleText.prototype.getDropShadowPadding = function () {
            var _this = this;
            var maxDistance = 0;
            var maxBlur = 0;
            Object.keys(this.textStyles).forEach(function (styleKey) {
                var _a = _this.textStyles[styleKey], dropShadowDistance = _a.dropShadowDistance, dropShadowBlur = _a.dropShadowBlur;
                maxDistance = Math.max(maxDistance, dropShadowDistance || 0);
                maxBlur = Math.max(maxBlur, dropShadowBlur || 0);
            });
            return maxDistance + maxBlur;
        };
        MultiStyleText.prototype.updateText = function () {
            var _this = this;
            if (!this.dirty) {
                return;
            }
            this.hitboxes = [];
            this.texture.baseTexture.resolution = this.resolution;
            var textStyles = this.textStyles;
            var outputText = this.text;
            if (this._style.wordWrap) {
                outputText = this.wordWrap(this.text);
            }
            var lines = outputText.split(/(?:\r\n|\r|\n)/);
            var outputTextData = this._getTextDataPerLine(lines);
            var lineWidths = [];
            var lineYMins = [];
            var lineYMaxs = [];
            var baselines = [];
            var maxLineWidth = 0;
            for (var i = 0; i < lines.length; i++) {
                var lineWidth = 0;
                var lineYMin = 0;
                var lineYMax = 0;
                var baseline = 0;
                for (var j = 0; j < outputTextData[i].length; j++) {
                    var sty = outputTextData[i][j].style;
                    this.context.font = this.getFontString(sty);
                    outputTextData[i][j].width = this.context.measureText(outputTextData[i][j].text).width;
                    if (outputTextData[i][j].text.length === 0) {
                        outputTextData[i][j].width += (outputTextData[i][j].text.length - 1) * sty.letterSpacing;
                        if (j > 0) {
                            lineWidth += sty.letterSpacing / 2;
                        }
                        if (j < outputTextData[i].length - 1) {
                            lineWidth += sty.letterSpacing / 2;
                        }
                    }
                    lineWidth += outputTextData[i][j].width;
                    outputTextData[i][j].fontProperties = PIXI.TextMetrics.measureFont(this.context.font);
                    outputTextData[i][j].height =
                        outputTextData[i][j].fontProperties.fontSize + outputTextData[i][j].style.strokeThickness;
                    if (typeof sty.valign === "number") {
                        lineYMin = Math.min(lineYMin, sty.valign - outputTextData[i][j].fontProperties.descent);
                        lineYMax = Math.max(lineYMax, sty.valign + outputTextData[i][j].fontProperties.ascent);
                    }
                    else {
                        lineYMin = Math.min(lineYMin, -outputTextData[i][j].fontProperties.descent);
                        lineYMax = Math.max(lineYMax, outputTextData[i][j].fontProperties.ascent);
                    }
                }
                lineWidths[i] = lineWidth;
                lineYMins[i] = lineYMin;
                lineYMaxs[i] = lineYMax;
                maxLineWidth = Math.max(maxLineWidth, lineWidth);
            }
            var stylesArray = Object.keys(textStyles).map(function (key) { return textStyles[key]; });
            var maxStrokeThickness = stylesArray.reduce(function (prev, cur) { return Math.max(prev, cur.strokeThickness || 0); }, 0);
            var dropShadowPadding = this.getDropShadowPadding();
            var totalHeight = lineYMaxs.reduce(function (prev, cur) { return prev + cur; }, 0) - lineYMins.reduce(function (prev, cur) { return prev + cur; }, 0);
            var width = maxLineWidth + maxStrokeThickness + 2 * dropShadowPadding;
            var height = totalHeight + 2 * dropShadowPadding;
            this.canvas.width = (width + this.context.lineWidth) * this.resolution;
            this.canvas.height = height * this.resolution;
            this.context.scale(this.resolution, this.resolution);
            this.context.textBaseline = "alphabetic";
            this.context.lineJoin = "round";
            var basePositionY = dropShadowPadding;
            var drawingData = [];
            for (var i = 0; i < outputTextData.length; i++) {
                var line = outputTextData[i];
                var linePositionX = void 0;
                switch (this._style.align) {
                    case "left":
                        linePositionX = dropShadowPadding;
                        break;
                    case "center":
                        linePositionX = dropShadowPadding + (maxLineWidth - lineWidths[i]) / 2;
                        break;
                    case "right":
                        linePositionX = dropShadowPadding + maxLineWidth - lineWidths[i];
                        break;
                }
                for (var j = 0; j < line.length; j++) {
                    var _a = line[j], style = _a.style, text = _a.text, fontProperties = _a.fontProperties, width_1 = _a.width, height_1 = _a.height, tag = _a.tag;
                    linePositionX += maxStrokeThickness / 2;
                    var linePositionY = maxStrokeThickness / 2 + basePositionY + fontProperties.ascent;
                    switch (style.valign) {
                        case "top":
                            break;
                        case "baseline":
                            linePositionY += lineYMaxs[i] - fontProperties.ascent;
                            break;
                        case "middle":
                            linePositionY += (lineYMaxs[i] - lineYMins[i] - fontProperties.ascent - fontProperties.descent) / 2;
                            break;
                        case "bottom":
                            linePositionY += lineYMaxs[i] - lineYMins[i] - fontProperties.ascent - fontProperties.descent;
                            break;
                        default:
                            linePositionY += lineYMaxs[i] - fontProperties.ascent - style.valign;
                            break;
                    }
                    if (style.letterSpacing === 0) {
                        drawingData.push({
                            text: text,
                            style: style,
                            x: linePositionX,
                            y: linePositionY,
                            width: width_1,
                            ascent: fontProperties.ascent,
                            descent: fontProperties.descent,
                            tag: tag
                        });
                        linePositionX += line[j].width;
                    }
                    else {
                        this.context.font = this.getFontString(line[j].style);
                        for (var k = 0; k < text.length; k++) {
                            if (k > 0 || j > 0) {
                                linePositionX += style.letterSpacing / 2;
                            }
                            drawingData.push({
                                text: text.charAt(k),
                                style: style,
                                x: linePositionX,
                                y: linePositionY,
                                width: width_1,
                                ascent: fontProperties.ascent,
                                descent: fontProperties.descent,
                                tag: tag
                            });
                            linePositionX += this.context.measureText(text.charAt(k)).width;
                            if (k < text.length - 1 || j < line.length - 1) {
                                linePositionX += style.letterSpacing / 2;
                            }
                        }
                    }
                    linePositionX -= maxStrokeThickness / 2;
                }
                basePositionY += lineYMaxs[i] - lineYMins[i];
            }
            this.context.save();
            drawingData.forEach(function (_a) {
                var style = _a.style, text = _a.text, x = _a.x, y = _a.y;
                if (!style.dropShadow) {
                    return;
                }
                _this.context.font = _this.getFontString(style);
                var dropFillStyle = style.dropShadowColor;
                if (typeof dropFillStyle === "number") {
                    dropFillStyle = PIXI.utils.hex2string(dropFillStyle);
                }
                _this.context.shadowColor = dropFillStyle;
                _this.context.shadowBlur = style.dropShadowBlur;
                _this.context.shadowOffsetX = Math.cos(style.dropShadowAngle) * style.dropShadowDistance * _this.resolution;
                _this.context.shadowOffsetY = Math.sin(style.dropShadowAngle) * style.dropShadowDistance * _this.resolution;
                _this.context.fillText(text, x, y);
            });
            this.context.restore();
            drawingData.forEach(function (_a) {
                var style = _a.style, text = _a.text, x = _a.x, y = _a.y, width = _a.width, ascent = _a.ascent, descent = _a.descent, tag = _a.tag;
                _this.context.font = _this.getFontString(style);
                var strokeStyle = style.stroke;
                if (typeof strokeStyle === "number") {
                    strokeStyle = PIXI.utils.hex2string(strokeStyle);
                }
                _this.context.strokeStyle = strokeStyle;
                _this.context.lineWidth = style.strokeThickness;
                var fillStyle = style.fill;
                if (typeof fillStyle === "number") {
                    fillStyle = PIXI.utils.hex2string(fillStyle);
                }
                else if (Array.isArray(fillStyle)) {
                    for (var i = 0; i < fillStyle.length; i++) {
                        var fill = fillStyle[i];
                        if (typeof fill === "number") {
                            fillStyle[i] = PIXI.utils.hex2string(fill);
                        }
                    }
                }
                _this.context.fillStyle = _this._generateFillStyle(new PIXI.TextStyle(style), [text]);
                if (style.stroke && style.strokeThickness) {
                    _this.context.strokeText(text, x, y);
                }
                if (style.fill) {
                    _this.context.fillText(text, x, y);
                }
                var offset = -_this._style.padding - _this.getDropShadowPadding();
                _this.hitboxes.push({
                    tag: tag,
                    hitbox: new PIXI.Rectangle(x + offset, y - ascent + offset, width, ascent + descent)
                });
                var debugSpan = style.debug === undefined
                    ? MultiStyleText.debugOptions.spans.enabled
                    : style.debug;
                if (debugSpan) {
                    _this.context.lineWidth = 1;
                    if (MultiStyleText.debugOptions.spans.bounding) {
                        _this.context.fillStyle = MultiStyleText.debugOptions.spans.bounding;
                        _this.context.strokeStyle = MultiStyleText.debugOptions.spans.bounding;
                        _this.context.beginPath();
                        _this.context.rect(x, y - ascent, width, ascent + descent);
                        _this.context.fill();
                        _this.context.stroke();
                        _this.context.stroke();
                    }
                    if (MultiStyleText.debugOptions.spans.baseline) {
                        _this.context.strokeStyle = MultiStyleText.debugOptions.spans.baseline;
                        _this.context.beginPath();
                        _this.context.moveTo(x, y);
                        _this.context.lineTo(x + width, y);
                        _this.context.closePath();
                        _this.context.stroke();
                    }
                    if (MultiStyleText.debugOptions.spans.top) {
                        _this.context.strokeStyle = MultiStyleText.debugOptions.spans.top;
                        _this.context.beginPath();
                        _this.context.moveTo(x, y - ascent);
                        _this.context.lineTo(x + width, y - ascent);
                        _this.context.closePath();
                        _this.context.stroke();
                    }
                    if (MultiStyleText.debugOptions.spans.bottom) {
                        _this.context.strokeStyle = MultiStyleText.debugOptions.spans.bottom;
                        _this.context.beginPath();
                        _this.context.moveTo(x, y + descent);
                        _this.context.lineTo(x + width, y + descent);
                        _this.context.closePath();
                        _this.context.stroke();
                    }
                    if (MultiStyleText.debugOptions.spans.text) {
                        _this.context.fillStyle = "#ffffff";
                        _this.context.strokeStyle = "#000000";
                        _this.context.lineWidth = 2;
                        _this.context.font = "8px monospace";
                        _this.context.strokeText(tag.name, x, y - ascent + 8);
                        _this.context.fillText(tag.name, x, y - ascent + 8);
                        _this.context.strokeText(width.toFixed(2) + "x" + (ascent + descent).toFixed(2), x, y - ascent + 16);
                        _this.context.fillText(width.toFixed(2) + "x" + (ascent + descent).toFixed(2), x, y - ascent + 16);
                    }
                }
            });
            if (MultiStyleText.debugOptions.objects.enabled) {
                if (MultiStyleText.debugOptions.objects.bounding) {
                    this.context.fillStyle = MultiStyleText.debugOptions.objects.bounding;
                    this.context.beginPath();
                    this.context.rect(0, 0, width, height);
                    this.context.fill();
                }
                if (MultiStyleText.debugOptions.objects.text) {
                    this.context.fillStyle = "#ffffff";
                    this.context.strokeStyle = "#000000";
                    this.context.lineWidth = 2;
                    this.context.font = "8px monospace";
                    this.context.strokeText(width.toFixed(2) + "x" + height.toFixed(2), 0, 8, width);
                    this.context.fillText(width.toFixed(2) + "x" + height.toFixed(2), 0, 8, width);
                }
            }
            this.updateTexture();
        };
        MultiStyleText.prototype.wordWrap = function (text) {
            var result = "";
            var re = this.getTagRegex(true, true);
            var lines = text.split("\n");
            var wordWrapWidth = this._style.wordWrapWidth;
            var styleStack = [this.assign({}, this.textStyles["default"])];
            this.context.font = this.getFontString(this.textStyles["default"]);
            for (var i = 0; i < lines.length; i++) {
                var spaceLeft = wordWrapWidth;
                var tagSplit = lines[i].split(re);
                var firstWordOfLine = true;
                for (var j = 0; j < tagSplit.length; j++) {
                    if (re.test(tagSplit[j])) {
                        result += tagSplit[j];
                        if (tagSplit[j][1] === "/") {
                            j += 2;
                            styleStack.pop();
                        }
                        else {
                            j++;
                            styleStack.push(this.assign({}, styleStack[styleStack.length - 1], this.textStyles[tagSplit[j]]));
                            j++;
                        }
                        this.context.font = this.getFontString(styleStack[styleStack.length - 1]);
                    }
                    else {
                        var words = tagSplit[j].split(" ");
                        for (var k = 0; k < words.length; k++) {
                            var wordWidth = this.context.measureText(words[k]).width;
                            if (this._style.breakWords && wordWidth > spaceLeft) {
                                var characters = words[k].split('');
                                if (k > 0) {
                                    result += " ";
                                    spaceLeft -= this.context.measureText(" ").width;
                                }
                                for (var c = 0; c < characters.length; c++) {
                                    var characterWidth = this.context.measureText(characters[c]).width;
                                    if (characterWidth > spaceLeft) {
                                        result += "\n" + characters[c];
                                        spaceLeft = wordWrapWidth - characterWidth;
                                    }
                                    else {
                                        result += characters[c];
                                        spaceLeft -= characterWidth;
                                    }
                                }
                            }
                            else if (this._style.breakWords) {
                                result += words[k];
                                spaceLeft -= wordWidth;
                            }
                            else {
                                var paddedWordWidth = wordWidth + (k > 0 ? this.context.measureText(" ").width : 0);
                                if (paddedWordWidth > spaceLeft) {
                                    if (!firstWordOfLine) {
                                        result += "\n";
                                    }
                                    result += words[k];
                                    spaceLeft = wordWrapWidth - wordWidth;
                                }
                                else {
                                    spaceLeft -= paddedWordWidth;
                                    if (k > 0) {
                                        result += " ";
                                    }
                                    result += words[k];
                                }
                            }
                            firstWordOfLine = false;
                        }
                    }
                }
                if (i < lines.length - 1) {
                    result += '\n';
                }
            }
            return result;
        };
        MultiStyleText.prototype.updateTexture = function () {
            var texture = this._texture;
            var dropShadowPadding = this.getDropShadowPadding();
            texture.baseTexture.hasLoaded = true;
            texture.baseTexture.resolution = this.resolution;
            texture.baseTexture.realWidth = this.canvas.width;
            texture.baseTexture.realHeight = this.canvas.height;
            texture.baseTexture.width = this.canvas.width / this.resolution;
            texture.baseTexture.height = this.canvas.height / this.resolution;
            texture.trim.width = texture.frame.width = this.canvas.width / this.resolution;
            texture.trim.height = texture.frame.height = this.canvas.height / this.resolution;
            texture.trim.x = -this._style.padding - dropShadowPadding;
            texture.trim.y = -this._style.padding - dropShadowPadding;
            texture.orig.width = texture.frame.width - (this._style.padding + dropShadowPadding) * 2;
            texture.orig.height = texture.frame.height - (this._style.padding + dropShadowPadding) * 2;
            this._onTextureUpdate();
            texture.baseTexture.emit('update', texture.baseTexture);
            this.dirty = false;
        };
        MultiStyleText.prototype.assign = function (destination) {
            var sources = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                sources[_i - 1] = arguments[_i];
            }
            for (var _a = 0, sources_1 = sources; _a < sources_1.length; _a++) {
                var source = sources_1[_a];
                for (var key in source) {
                    destination[key] = source[key];
                }
            }
            return destination;
        };
        MultiStyleText.DEFAULT_TAG_STYLE = {
            align: "left",
            breakWords: false,
            dropShadow: false,
            dropShadowAngle: Math.PI / 6,
            dropShadowBlur: 0,
            dropShadowColor: "#000000",
            dropShadowDistance: 5,
            fill: "black",
            fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
            fontFamily: "Arial",
            fontSize: 26,
            fontStyle: "normal",
            fontVariant: "normal",
            fontWeight: "normal",
            letterSpacing: 0,
            lineHeight: 0,
            lineJoin: "miter",
            miterLimit: 10,
            padding: 0,
            stroke: "black",
            strokeThickness: 0,
            textBaseline: "alphabetic",
            valign: "baseline",
            wordWrap: false,
            wordWrapWidth: 100
        };
        MultiStyleText.debugOptions = {
            spans: {
                enabled: false,
                baseline: "#44BB44",
                top: "#BB4444",
                bottom: "#4444BB",
                bounding: "rgba(255, 255, 255, 0.1)",
                text: true
            },
            objects: {
                enabled: false,
                bounding: "rgba(255, 255, 255, 0.05)",
                text: true
            }
        };
        return MultiStyleText;
    }(PIXI.Text));
    exports.default = MultiStyleText;
});

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsInBpeGktbXVsdGlzdHlsZS10ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ0VBLFlBQVksQ0FBQzs7SUE4RGIsSUFBTSxrQkFBa0IsR0FBRztRQUMxQixhQUFhO1FBQ2IsY0FBYztRQUNkLGFBQWE7UUFDYixhQUFhO1FBQ2IsV0FBVztRQUNYLGVBQWU7UUFDZixZQUFZO1FBQ1osY0FBYztRQUNkLG1CQUFtQjtRQUNuQixvQkFBb0I7UUFDcEIsV0FBVztRQUNYLFlBQVk7UUFDWixXQUFXO1FBQ1gsV0FBVztRQUNYLFNBQVM7UUFDVCxhQUFhO1FBQ2IsVUFBVTtRQUNWLFlBQVk7UUFDWixXQUFXO1FBQ1gsWUFBWTtRQUNaLFdBQVc7UUFDWCxXQUFXO1FBQ1gsU0FBUztRQUNULGFBQWE7UUFDYixVQUFVO1FBQ1YsWUFBWTtLQUNaLENBQUM7SUFFRjtRQUE0QyxrQ0FBUztRQWtEcEQsd0JBQVksSUFBWSxFQUFFLE1BQW9CO1lBQTlDLFlBQ0Msa0JBQU0sSUFBSSxDQUFDLFNBT1g7WUFMQSxLQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUVyQixrQkFBa0IsQ0FBQyxPQUFPLENBQUMsVUFBQyxLQUFLO2dCQUNoQyxLQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxVQUFDLENBQW9DLElBQUssT0FBQSxLQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQXpCLENBQXlCLENBQUMsQ0FBQztZQUNyRixDQUFDLENBQUMsQ0FBQzs7UUFDSixDQUFDO1FBRU8sMENBQWlCLEdBQXpCLFVBQTBCLENBQW9DO1lBQzdELElBQUksRUFBRSxHQUFHLENBQXdCLENBQUM7WUFFbEMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMv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QkQsQUFpc0JDLENBanNCMkMsSUFBSSxDQUFDLElBQUksR0Fpc0JwRDtzQkFqc0JvQixjQUFjIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9waXhpLW11bHRpc3R5bGUtdGV4dFwiKS5kZWZhdWx0OyIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwicGl4aS5qc1wiIC8+XG5cblwidXNlIHN0cmljdFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEV4dGVuZGVkVGV4dFN0eWxlIGV4dGVuZHMgUElYSS5UZXh0U3R5bGVPcHRpb25zIHtcblx0dmFsaWduPzogXCJ0b3BcIiB8IFwibWlkZGxlXCIgfCBcImJvdHRvbVwiIHwgXCJiYXNlbGluZVwiIHwgbnVtYmVyO1xuXHRkZWJ1Zz86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGV4dFN0eWxlU2V0IHtcblx0W2tleTogc3RyaW5nXTogRXh0ZW5kZWRUZXh0U3R5bGU7XG59XG5cbmludGVyZmFjZSBGb250UHJvcGVydGllcyB7XG5cdGFzY2VudDogbnVtYmVyO1xuXHRkZXNjZW50OiBudW1iZXI7XG5cdGZvbnRTaXplOiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBUZXh0RGF0YSB7XG5cdHRleHQ6IHN0cmluZztcblx0c3R5bGU6IEV4dGVuZGVkVGV4dFN0eWxlO1xuXHR3aWR0aDogbnVtYmVyO1xuXHRoZWlnaHQ6IG51bWJlcjtcblx0Zm9udFByb3BlcnRpZXM6IEZvbnRQcm9wZXJ0aWVzO1xuXHR0YWc6IFRhZ0RhdGE7XG59XG5cbmludGVyZmFjZSBUZXh0RHJhd2luZ0RhdGEge1xuXHR0ZXh0OiBzdHJpbmc7XG5cdHN0eWxlOiBFeHRlbmRlZFRleHRTdHlsZTtcblx0eDogbnVtYmVyO1xuXHR5OiBudW1iZXI7XG5cdHdpZHRoOiBudW1iZXI7XG5cdGFzY2VudDogbnVtYmVyO1xuXHRkZXNjZW50OiBudW1iZXI7XG5cdHRhZzogVGFnRGF0YTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNc3REZWJ1Z09wdGlvbnMge1xuXHRzcGFuczoge1xuXHRcdGVuYWJsZWQ/OiBib29sZWFuO1xuXHRcdGJhc2VsaW5lPzogc3RyaW5nO1xuXHRcdHRvcD86IHN0cmluZztcblx0XHRib3R0b20/OiBzdHJpbmc7XG5cdFx0Ym91bmRpbmc/OiBzdHJpbmc7XG5cdFx0dGV4dD86IGJvb2xlYW47XG5cdH07XG5cdG9iamVjdHM6IHtcblx0XHRlbmFibGVkPzogYm9vbGVhbjtcblx0XHRib3VuZGluZz86IHN0cmluZztcblx0XHR0ZXh0PzogYm9vbGVhbjtcblx0fVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRhZ0RhdGEge1xuXHRuYW1lOiBzdHJpbmc7XG5cdHByb3BlcnRpZXM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTXN0SW50ZXJhY3Rpb25FdmVudCBleHRlbmRzIFBJWEkuaW50ZXJhY3Rpb24uSW50ZXJhY3Rpb25FdmVudCB7XG5cdHRhcmdldFRhZzogVGFnRGF0YTtcbn1cblxuY29uc3QgSU5URVJBQ1RJT05fRVZFTlRTID0gW1xuXHRcInBvaW50ZXJvdmVyXCIsXG5cdFwicG9pbnRlcmVudGVyXCIsXG5cdFwicG9pbnRlcmRvd25cIixcblx0XCJwb2ludGVybW92ZVwiLFxuXHRcInBvaW50ZXJ1cFwiLFxuXHRcInBvaW50ZXJjYW5jZWxcIixcblx0XCJwb2ludGVyb3V0XCIsXG5cdFwicG9pbnRlcmxlYXZlXCIsXG5cdFwiZ290cG9pbnRlcmNhcHR1cmVcIixcblx0XCJsb3N0cG9pbnRlcmNhcHR1cmVcIixcblx0XCJtb3VzZW92ZXJcIixcblx0XCJtb3VzZWVudGVyXCIsXG5cdFwibW91c2Vkb3duXCIsXG5cdFwibW91c2Vtb3ZlXCIsXG5cdFwibW91c2V1cFwiLFxuXHRcIm1vdXNlY2FuY2VsXCIsXG5cdFwibW91c2VvdXRcIixcblx0XCJtb3VzZWxlYXZlXCIsXG5cdFwidG91Y2hvdmVyXCIsXG5cdFwidG91Y2hlbnRlclwiLFxuXHRcInRvdWNoZG93blwiLFxuXHRcInRvdWNobW92ZVwiLFxuXHRcInRvdWNodXBcIixcblx0XCJ0b3VjaGNhbmNlbFwiLFxuXHRcInRvdWNob3V0XCIsXG5cdFwidG91Y2hsZWF2ZVwiXG5dO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNdWx0aVN0eWxlVGV4dCBleHRlbmRzIFBJWEkuVGV4dCB7XG5cdHByaXZhdGUgc3RhdGljIERFRkFVTFRfVEFHX1NUWUxFOiBFeHRlbmRlZFRleHRTdHlsZSA9IHtcblx0XHRhbGlnbjogXCJsZWZ0XCIsXG5cdFx0YnJlYWtXb3JkczogZmFsc2UsXG5cdFx0Ly8gZGVidWcgaW50ZW50aW9uYWxseSBub3QgaW5jbHVkZWRcblx0XHRkcm9wU2hhZG93OiBmYWxzZSxcblx0XHRkcm9wU2hhZG93QW5nbGU6IE1hdGguUEkgLyA2LFxuXHRcdGRyb3BTaGFkb3dCbHVyOiAwLFxuXHRcdGRyb3BTaGFkb3dDb2xvcjogXCIjMDAwMDAwXCIsXG5cdFx0ZHJvcFNoYWRvd0Rpc3RhbmNlOiA1LFxuXHRcdGZpbGw6IFwiYmxhY2tcIixcblx0XHRmaWxsR3JhZGllbnRUeXBlOiBQSVhJLlRFWFRfR1JBRElFTlQuTElORUFSX1ZFUlRJQ0FMLFxuXHRcdGZvbnRGYW1pbHk6IFwiQXJpYWxcIixcblx0XHRmb250U2l6ZTogMjYsXG5cdFx0Zm9udFN0eWxlOiBcIm5vcm1hbFwiLFxuXHRcdGZvbnRWYXJpYW50OiBcIm5vcm1hbFwiLFxuXHRcdGZvbnRXZWlnaHQ6IFwibm9ybWFsXCIsXG5cdFx0bGV0dGVyU3BhY2luZzogMCxcblx0XHRsaW5lSGVpZ2h0OiAwLFxuXHRcdGxpbmVKb2luOiBcIm1pdGVyXCIsXG5cdFx0bWl0ZXJMaW1pdDogMTAsXG5cdFx0cGFkZGluZzogMCxcblx0XHRzdHJva2U6IFwiYmxhY2tcIixcblx0XHRzdHJva2VUaGlja25lc3M6IDAsXG5cdFx0dGV4dEJhc2VsaW5lOiBcImFscGhhYmV0aWNcIixcblx0XHR2YWxpZ246IFwiYmFzZWxpbmVcIixcblx0XHR3b3JkV3JhcDogZmFsc2UsXG5cdFx0d29yZFdyYXBXaWR0aDogMTAwXG5cdH07XG5cblx0cHVibGljIHN0YXRpYyBkZWJ1Z09wdGlvbnM6IE1zdERlYnVnT3B0aW9ucyA9IHtcblx0XHRzcGFuczoge1xuXHRcdFx0ZW5hYmxlZDogZmFsc2UsXG5cdFx0XHRiYXNlbGluZTogXCIjNDRCQjQ0XCIsXG5cdFx0XHR0b3A6IFwiI0JCNDQ0NFwiLFxuXHRcdFx0Ym90dG9tOiBcIiM0NDQ0QkJcIixcblx0XHRcdGJvdW5kaW5nOiBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKVwiLFxuXHRcdFx0dGV4dDogdHJ1ZVxuXHRcdH0sXG5cdFx0b2JqZWN0czoge1xuXHRcdFx0ZW5hYmxlZDogZmFsc2UsXG5cdFx0XHRib3VuZGluZzogXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpXCIsXG5cdFx0XHR0ZXh0OiB0cnVlXG5cdFx0fVxuXHR9O1xuXG5cdHByaXZhdGUgdGV4dFN0eWxlczogVGV4dFN0eWxlU2V0O1xuXG5cdHByaXZhdGUgaGl0Ym94ZXM6IHsgdGFnOiBUYWdEYXRhLCBoaXRib3g6IFBJWEkuUmVjdGFuZ2xlIH1bXTtcblxuXHRjb25zdHJ1Y3Rvcih0ZXh0OiBzdHJpbmcsIHN0eWxlczogVGV4dFN0eWxlU2V0KSB7XG5cdFx0c3VwZXIodGV4dCk7XG5cblx0XHR0aGlzLnN0eWxlcyA9IHN0eWxlcztcblxuXHRcdElOVEVSQUNUSU9OX0VWRU5UUy5mb3JFYWNoKChldmVudCkgPT4ge1xuXHRcdFx0dGhpcy5vbihldmVudCwgKGU6IFBJWEkuaW50ZXJhY3Rpb24uSW50ZXJhY3Rpb25FdmVudCkgPT4gdGhpcy5oYW5kbGVJbnRlcmFjdGlvbihlKSk7XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGhhbmRsZUludGVyYWN0aW9uKGU6IFBJWEkuaW50ZXJhY3Rpb24uSW50ZXJhY3Rpb25FdmVudCkge1xuXHRcdGxldCBldiA9IGUgYXMgTXN0SW50ZXJhY3Rpb25FdmVudDtcblxuXHRcdGxldCBsb2NhbFBvaW50ID0gZS5kYXRhLmdldExvY2FsUG9zaXRpb24odGhpcyk7XG5cdFx0bGV0IHRhcmdldFRhZyA9IHRoaXMuaGl0Ym94ZXMucmVkdWNlKChwcmV2LCBoaXRib3gpID0+IHByZXYgIT09IHVuZGVmaW5lZCA/IHByZXYgOiAoaGl0Ym94LmhpdGJveC5jb250YWlucyhsb2NhbFBvaW50LngsIGxvY2FsUG9pbnQueSkgPyBoaXRib3ggOiB1bmRlZmluZWQpLCB1bmRlZmluZWQpO1xuXHRcdGV2LnRhcmdldFRhZyA9IHRhcmdldFRhZyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdGFyZ2V0VGFnLnRhZztcblx0fVxuXG5cdHB1YmxpYyBzZXQgc3R5bGVzKHN0eWxlczogVGV4dFN0eWxlU2V0KSB7XG5cdFx0dGhpcy50ZXh0U3R5bGVzID0ge307XG5cblx0XHR0aGlzLnRleHRTdHlsZXNbXCJkZWZhdWx0XCJdID0gdGhpcy5hc3NpZ24oe30sIE11bHRpU3R5bGVUZXh0LkRFRkFVTFRfVEFHX1NUWUxFKTtcblxuXHRcdGZvciAobGV0IHN0eWxlIGluIHN0eWxlcykge1xuXHRcdFx0aWYgKHN0eWxlID09PSBcImRlZmF1bHRcIikge1xuXHRcdFx0XHR0aGlzLmFzc2lnbih0aGlzLnRleHRTdHlsZXNbXCJkZWZhdWx0XCJdLCBzdHlsZXNbc3R5bGVdKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMudGV4dFN0eWxlc1tzdHlsZV0gPSB0aGlzLmFzc2lnbih7fSwgc3R5bGVzW3N0eWxlXSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5fc3R5bGUgPSBuZXcgUElYSS5UZXh0U3R5bGUodGhpcy50ZXh0U3R5bGVzW1wiZGVmYXVsdFwiXSk7XG5cdFx0dGhpcy5kaXJ0eSA9IHRydWU7XG5cdH1cblxuXHRwdWJsaWMgc2V0VGFnU3R5bGUodGFnOiBzdHJpbmcsIHN0eWxlOiBFeHRlbmRlZFRleHRTdHlsZSk6IHZvaWQge1xuXHRcdGlmICh0YWcgaW4gdGhpcy50ZXh0U3R5bGVzKSB7XG5cdFx0XHR0aGlzLmFzc2lnbih0aGlzLnRleHRTdHlsZXNbdGFnXSwgc3R5bGUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnRleHRTdHlsZXNbdGFnXSA9IHRoaXMuYXNzaWduKHt9LCBzdHlsZSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fc3R5bGUgPSBuZXcgUElYSS5UZXh0U3R5bGUodGhpcy50ZXh0U3R5bGVzW1wiZGVmYXVsdFwiXSk7XG5cdFx0dGhpcy5kaXJ0eSA9IHRydWU7XG5cdH1cblxuXHRwdWJsaWMgZGVsZXRlVGFnU3R5bGUodGFnOiBzdHJpbmcpOiB2b2lkIHtcblx0XHRpZiAodGFnID09PSBcImRlZmF1bHRcIikge1xuXHRcdFx0dGhpcy50ZXh0U3R5bGVzW1wiZGVmYXVsdFwiXSA9IHRoaXMuYXNzaWduKHt9LCBNdWx0aVN0eWxlVGV4dC5ERUZBVUxUX1RBR19TVFlMRSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlbGV0ZSB0aGlzLnRleHRTdHlsZXNbdGFnXTtcblx0XHR9XG5cblx0XHR0aGlzLl9zdHlsZSA9IG5ldyBQSVhJLlRleHRTdHlsZSh0aGlzLnRleHRTdHlsZXNbXCJkZWZhdWx0XCJdKTtcblx0XHR0aGlzLmRpcnR5ID0gdHJ1ZTtcblx0fVxuXG5cdHByaXZhdGUgZ2V0VGFnUmVnZXgoY2FwdHVyZU5hbWU6IGJvb2xlYW4sIGNhcHR1cmVNYXRjaDogYm9vbGVhbik6IFJlZ0V4cCB7XG5cdFx0bGV0IHRhZ0FsdGVybmF0aW9uID0gT2JqZWN0LmtleXModGhpcy50ZXh0U3R5bGVzKS5qb2luKFwifFwiKTtcblxuXHRcdGlmIChjYXB0dXJlTmFtZSkge1xuXHRcdFx0dGFnQWx0ZXJuYXRpb24gPSBgKCR7dGFnQWx0ZXJuYXRpb259KWA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRhZ0FsdGVybmF0aW9uID0gYCg/OiR7dGFnQWx0ZXJuYXRpb259KWA7XG5cdFx0fVxuXG5cdFx0bGV0IHJlU3RyID0gYDwke3RhZ0FsdGVybmF0aW9ufSg/OlxcXFxzK1tBLVphLXowLTlfXFxcXC1dKz0oPzpcIig/OlteXCJdK3xcXFxcXFxcXFwiKSpcInwnKD86W14nXSt8XFxcXFxcXFwnKSonKSkqXFxcXHMqPnw8LyR7dGFnQWx0ZXJuYXRpb259XFxcXHMqPmA7XG5cblx0XHRpZiAoY2FwdHVyZU1hdGNoKSB7XG5cdFx0XHRyZVN0ciA9IGAoJHtyZVN0cn0pYDtcblx0XHR9XG5cblx0XHRyZXR1cm4gbmV3IFJlZ0V4cChyZVN0ciwgXCJnXCIpO1xuXHR9XG5cblx0cHJpdmF0ZSBnZXRQcm9wZXJ0eVJlZ2V4KCk6IFJlZ0V4cCB7XG5cdFx0cmV0dXJuIG5ldyBSZWdFeHAoYChbQS1aYS16MC05X1xcXFwtXSspPSg/OlwiKCg/OlteXCJdK3xcXFxcXFxcXFwiKSopXCJ8JygoPzpbXiddK3xcXFxcXFxcXCcpKiknKWAsIFwiZ1wiKTtcblx0fVxuXG5cdHByaXZhdGUgX2dldFRleHREYXRhUGVyTGluZSAobGluZXM6IHN0cmluZ1tdKSB7XG5cdFx0bGV0IG91dHB1dFRleHREYXRhOiBUZXh0RGF0YVtdW10gPSBbXTtcblx0XHRsZXQgcmUgPSB0aGlzLmdldFRhZ1JlZ2V4KHRydWUsIGZhbHNlKTtcblxuXHRcdGxldCBzdHlsZVN0YWNrID0gW3RoaXMuYXNzaWduKHt9LCB0aGlzLnRleHRTdHlsZXNbXCJkZWZhdWx0XCJdKV07XG5cdFx0bGV0IHRhZ1N0YWNrOiBUYWdEYXRhW10gPSBbeyBuYW1lOiBcImRlZmF1bHRcIiwgcHJvcGVydGllczoge30gfV07XG5cblx0XHQvLyBkZXRlcm1pbmUgdGhlIGdyb3VwIG9mIHdvcmQgZm9yIGVhY2ggbGluZVxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBsaW5lVGV4dERhdGE6IFRleHREYXRhW10gPSBbXTtcblxuXHRcdFx0Ly8gZmluZCB0YWdzIGluc2lkZSB0aGUgc3RyaW5nXG5cdFx0XHRsZXQgbWF0Y2hlczogUmVnRXhwRXhlY0FycmF5W10gPSBbXTtcblx0XHRcdGxldCBtYXRjaEFycmF5OiBSZWdFeHBFeGVjQXJyYXk7XG5cblx0XHRcdHdoaWxlIChtYXRjaEFycmF5ID0gcmUuZXhlYyhsaW5lc1tpXSkpIHtcblx0XHRcdFx0bWF0Y2hlcy5wdXNoKG1hdGNoQXJyYXkpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBpZiB0aGVyZSBpcyBubyBtYXRjaCwgd2Ugc3RpbGwgbmVlZCB0byBhZGQgdGhlIGxpbmUgd2l0aCB0aGUgZGVmYXVsdCBzdHlsZVxuXHRcdFx0aWYgKG1hdGNoZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdGxpbmVUZXh0RGF0YS5wdXNoKHRoaXMuY3JlYXRlVGV4dERhdGEobGluZXNbaV0sIHN0eWxlU3RhY2tbc3R5bGVTdGFjay5sZW5ndGggLSAxXSwgdGFnU3RhY2tbdGFnU3RhY2subGVuZ3RoIC0gMV0pKTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHQvLyBXZSBnb3QgYSBtYXRjaCEgYWRkIHRoZSB0ZXh0IHdpdGggdGhlIG5lZWRlZCBzdHlsZVxuXHRcdFx0XHRsZXQgY3VycmVudFNlYXJjaElkeCA9IDA7XG5cdFx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgbWF0Y2hlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdC8vIGlmIGluZGV4ID4gMCwgaXQgbWVhbnMgd2UgaGF2ZSBjaGFyYWN0ZXJzIGJlZm9yZSB0aGUgbWF0Y2gsXG5cdFx0XHRcdFx0Ly8gc28gd2UgbmVlZCB0byBhZGQgaXQgd2l0aCB0aGUgZGVmYXVsdCBzdHlsZVxuXHRcdFx0XHRcdGlmIChtYXRjaGVzW2pdLmluZGV4ID4gY3VycmVudFNlYXJjaElkeCkge1xuXHRcdFx0XHRcdFx0bGluZVRleHREYXRhLnB1c2godGhpcy5jcmVhdGVUZXh0RGF0YShcblx0XHRcdFx0XHRcdFx0bGluZXNbaV0uc3Vic3RyaW5nKGN1cnJlbnRTZWFyY2hJZHgsIG1hdGNoZXNbal0uaW5kZXgpLFxuXHRcdFx0XHRcdFx0XHRzdHlsZVN0YWNrW3N0eWxlU3RhY2subGVuZ3RoIC0gMV0sXG5cdFx0XHRcdFx0XHRcdHRhZ1N0YWNrW3RhZ1N0YWNrLmxlbmd0aCAtIDFdXG5cdFx0XHRcdFx0XHQpKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAobWF0Y2hlc1tqXVswXVsxXSA9PT0gXCIvXCIpIHsgLy8gcmVzZXQgdGhlIHN0eWxlIGlmIGVuZCBvZiB0YWdcblx0XHRcdFx0XHRcdGlmIChzdHlsZVN0YWNrLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0XHRcdFx0c3R5bGVTdGFjay5wb3AoKTtcblx0XHRcdFx0XHRcdFx0dGFnU3RhY2sucG9wKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHsgLy8gc2V0IHRoZSBjdXJyZW50IHN0eWxlXG5cdFx0XHRcdFx0XHRzdHlsZVN0YWNrLnB1c2godGhpcy5hc3NpZ24oe30sIHN0eWxlU3RhY2tbc3R5bGVTdGFjay5sZW5ndGggLSAxXSwgdGhpcy50ZXh0U3R5bGVzW21hdGNoZXNbal1bMV1dKSk7XG5cblx0XHRcdFx0XHRcdGxldCBwcm9wZXJ0aWVzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG5cdFx0XHRcdFx0XHRsZXQgcHJvcGVydHlSZWdleCA9IHRoaXMuZ2V0UHJvcGVydHlSZWdleCgpO1xuXHRcdFx0XHRcdFx0bGV0IHByb3BlcnR5TWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXk7XG5cblx0XHRcdFx0XHRcdHdoaWxlIChwcm9wZXJ0eU1hdGNoID0gcHJvcGVydHlSZWdleC5leGVjKG1hdGNoZXNbal1bMF0pKSB7XG5cdFx0XHRcdFx0XHRcdHByb3BlcnRpZXNbcHJvcGVydHlNYXRjaFsxXV0gPSBwcm9wZXJ0eU1hdGNoWzJdIHx8IHByb3BlcnR5TWF0Y2hbM107XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRhZ1N0YWNrLnB1c2goeyBuYW1lOiBtYXRjaGVzW2pdWzFdLCBwcm9wZXJ0aWVzIH0pO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIHVwZGF0ZSB0aGUgY3VycmVudCBzZWFyY2ggaW5kZXhcblx0XHRcdFx0XHRjdXJyZW50U2VhcmNoSWR4ID0gbWF0Y2hlc1tqXS5pbmRleCArIG1hdGNoZXNbal1bMF0ubGVuZ3RoO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gaXMgdGhlcmUgYW55IGNoYXJhY3RlciBsZWZ0P1xuXHRcdFx0XHRpZiAoY3VycmVudFNlYXJjaElkeCA8IGxpbmVzW2ldLmxlbmd0aCkge1xuXHRcdFx0XHRcdGxpbmVUZXh0RGF0YS5wdXNoKHRoaXMuY3JlYXRlVGV4dERhdGEoXG5cdFx0XHRcdFx0XHRsaW5lc1tpXS5zdWJzdHJpbmcoY3VycmVudFNlYXJjaElkeCksXG5cdFx0XHRcdFx0XHRzdHlsZVN0YWNrW3N0eWxlU3RhY2subGVuZ3RoIC0gMV0sXG5cdFx0XHRcdFx0XHR0YWdTdGFja1t0YWdTdGFjay5sZW5ndGggLSAxXVxuXHRcdFx0XHRcdCkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdG91dHB1dFRleHREYXRhLnB1c2gobGluZVRleHREYXRhKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0VGV4dERhdGE7XG5cdH1cblxuXHRwcml2YXRlIGdldEZvbnRTdHJpbmcoc3R5bGU6IEV4dGVuZGVkVGV4dFN0eWxlKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gbmV3IFBJWEkuVGV4dFN0eWxlKHN0eWxlKS50b0ZvbnRTdHJpbmcoKTtcblx0fVxuXG5cdHByaXZhdGUgY3JlYXRlVGV4dERhdGEodGV4dDogc3RyaW5nLCBzdHlsZTogRXh0ZW5kZWRUZXh0U3R5bGUsIHRhZzogVGFnRGF0YSk6IFRleHREYXRhIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dGV4dCxcblx0XHRcdHN0eWxlLFxuXHRcdFx0d2lkdGg6IDAsXG5cdFx0XHRoZWlnaHQ6IDAsXG5cdFx0XHRmb250UHJvcGVydGllczogdW5kZWZpbmVkLFxuXHRcdFx0dGFnXG5cdFx0fTtcblx0fVxuXG5cdHByaXZhdGUgZ2V0RHJvcFNoYWRvd1BhZGRpbmcoKTogbnVtYmVyIHtcblx0XHRsZXQgbWF4RGlzdGFuY2UgPSAwO1xuXHRcdGxldCBtYXhCbHVyID0gMDtcblxuXHRcdCBPYmplY3Qua2V5cyh0aGlzLnRleHRTdHlsZXMpLmZvckVhY2goKHN0eWxlS2V5KSA9PiB7XG5cdFx0XHRsZXQgeyBkcm9wU2hhZG93RGlzdGFuY2UsIGRyb3BTaGFkb3dCbHVyIH0gPSB0aGlzLnRleHRTdHlsZXNbc3R5bGVLZXldO1xuXHRcdFx0bWF4RGlzdGFuY2UgPSBNYXRoLm1heChtYXhEaXN0YW5jZSwgZHJvcFNoYWRvd0Rpc3RhbmNlIHx8IDApO1xuXHRcdFx0bWF4Qmx1ciA9IE1hdGgubWF4KG1heEJsdXIsIGRyb3BTaGFkb3dCbHVyIHx8IDApO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIG1heERpc3RhbmNlICsgbWF4Qmx1cjtcblx0fVxuXG5cdHB1YmxpYyB1cGRhdGVUZXh0KCk6IHZvaWQge1xuXHRcdGlmICghdGhpcy5kaXJ0eSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuaGl0Ym94ZXMgPSBbXTtcblxuXHRcdHRoaXMudGV4dHVyZS5iYXNlVGV4dHVyZS5yZXNvbHV0aW9uID0gdGhpcy5yZXNvbHV0aW9uO1xuXHRcdGxldCB0ZXh0U3R5bGVzID0gdGhpcy50ZXh0U3R5bGVzO1xuXHRcdGxldCBvdXRwdXRUZXh0ID0gdGhpcy50ZXh0O1xuXG5cdFx0aWYodGhpcy5fc3R5bGUud29yZFdyYXApIHtcblx0XHRcdG91dHB1dFRleHQgPSB0aGlzLndvcmRXcmFwKHRoaXMudGV4dCk7XG5cdFx0fVxuXG5cdFx0Ly8gc3BsaXQgdGV4dCBpbnRvIGxpbmVzXG5cdFx0bGV0IGxpbmVzID0gb3V0cHV0VGV4dC5zcGxpdCgvKD86XFxyXFxufFxccnxcXG4pLyk7XG5cblx0XHQvLyBnZXQgdGhlIHRleHQgZGF0YSB3aXRoIHNwZWNpZmljIHN0eWxlc1xuXHRcdGxldCBvdXRwdXRUZXh0RGF0YSA9IHRoaXMuX2dldFRleHREYXRhUGVyTGluZShsaW5lcyk7XG5cblx0XHQvLyBjYWxjdWxhdGUgdGV4dCB3aWR0aCBhbmQgaGVpZ2h0XG5cdFx0bGV0IGxpbmVXaWR0aHM6IG51bWJlcltdID0gW107XG5cdFx0bGV0IGxpbmVZTWluczogbnVtYmVyW10gPSBbXTtcblx0XHRsZXQgbGluZVlNYXhzOiBudW1iZXJbXSA9IFtdO1xuXHRcdGxldCBiYXNlbGluZXM6IG51bWJlcltdID0gW107XG5cdFx0bGV0IG1heExpbmVXaWR0aCA9IDA7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgbGluZVdpZHRoID0gMDtcblx0XHRcdGxldCBsaW5lWU1pbiA9IDA7XG5cdFx0XHRsZXQgbGluZVlNYXggPSAwO1xuXHRcdFx0bGV0IGJhc2VsaW5lID0gMDtcblx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgb3V0cHV0VGV4dERhdGFbaV0ubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0bGV0IHN0eSA9IG91dHB1dFRleHREYXRhW2ldW2pdLnN0eWxlO1xuXG5cdFx0XHRcdHRoaXMuY29udGV4dC5mb250ID0gdGhpcy5nZXRGb250U3RyaW5nKHN0eSk7XG5cblx0XHRcdFx0Ly8gc2F2ZSB0aGUgd2lkdGhcblx0XHRcdFx0b3V0cHV0VGV4dERhdGFbaV1bal0ud2lkdGggPSB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQob3V0cHV0VGV4dERhdGFbaV1bal0udGV4dCkud2lkdGg7XG5cblx0XHRcdFx0aWYgKG91dHB1dFRleHREYXRhW2ldW2pdLnRleHQubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0b3V0cHV0VGV4dERhdGFbaV1bal0ud2lkdGggKz0gKG91dHB1dFRleHREYXRhW2ldW2pdLnRleHQubGVuZ3RoIC0gMSkgKiBzdHkubGV0dGVyU3BhY2luZztcblxuXHRcdFx0XHRcdGlmIChqID4gMCkge1xuXHRcdFx0XHRcdFx0bGluZVdpZHRoICs9IHN0eS5sZXR0ZXJTcGFjaW5nIC8gMjsgLy8gc3BhY2luZyBiZWZvcmUgZmlyc3QgY2hhcmFjdGVyXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGogPCBvdXRwdXRUZXh0RGF0YVtpXS5sZW5ndGggLSAxKSB7XG5cdFx0XHRcdFx0XHRsaW5lV2lkdGggKz0gc3R5LmxldHRlclNwYWNpbmcgLyAyOyAvLyBzcGFjaW5nIGFmdGVyIGxhc3QgY2hhcmFjdGVyXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGluZVdpZHRoICs9IG91dHB1dFRleHREYXRhW2ldW2pdLndpZHRoO1xuXG5cdFx0XHRcdC8vIHNhdmUgdGhlIGZvbnQgcHJvcGVydGllc1xuXHRcdFx0XHRvdXRwdXRUZXh0RGF0YVtpXVtqXS5mb250UHJvcGVydGllcyA9IFBJWEkuVGV4dE1ldHJpY3MubWVhc3VyZUZvbnQodGhpcy5jb250ZXh0LmZvbnQpO1xuXG5cdFx0XHRcdC8vIHNhdmUgdGhlIGhlaWdodFxuXHRcdFx0XHRvdXRwdXRUZXh0RGF0YVtpXVtqXS5oZWlnaHQgPVxuXHRcdFx0XHRcdFx0b3V0cHV0VGV4dERhdGFbaV1bal0uZm9udFByb3BlcnRpZXMuZm9udFNpemUgKyBvdXRwdXRUZXh0RGF0YVtpXVtqXS5zdHlsZS5zdHJva2VUaGlja25lc3M7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBzdHkudmFsaWduID09PSBcIm51bWJlclwiKSB7XG5cdFx0XHRcdFx0bGluZVlNaW4gPSBNYXRoLm1pbihsaW5lWU1pbiwgc3R5LnZhbGlnbiAtIG91dHB1dFRleHREYXRhW2ldW2pdLmZvbnRQcm9wZXJ0aWVzLmRlc2NlbnQpO1xuXHRcdFx0XHRcdGxpbmVZTWF4ID0gTWF0aC5tYXgobGluZVlNYXgsIHN0eS52YWxpZ24gKyBvdXRwdXRUZXh0RGF0YVtpXVtqXS5mb250UHJvcGVydGllcy5hc2NlbnQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxpbmVZTWluID0gTWF0aC5taW4obGluZVlNaW4sIC1vdXRwdXRUZXh0RGF0YVtpXVtqXS5mb250UHJvcGVydGllcy5kZXNjZW50KTtcblx0XHRcdFx0XHRsaW5lWU1heCA9IE1hdGgubWF4KGxpbmVZTWF4LCBvdXRwdXRUZXh0RGF0YVtpXVtqXS5mb250UHJvcGVydGllcy5hc2NlbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGxpbmVXaWR0aHNbaV0gPSBsaW5lV2lkdGg7XG5cdFx0XHRsaW5lWU1pbnNbaV0gPSBsaW5lWU1pbjtcblx0XHRcdGxpbmVZTWF4c1tpXSA9IGxpbmVZTWF4O1xuXHRcdFx0bWF4TGluZVdpZHRoID0gTWF0aC5tYXgobWF4TGluZVdpZHRoLCBsaW5lV2lkdGgpO1xuXHRcdH1cblxuXHRcdC8vIHRyYW5zZm9ybSBzdHlsZXMgaW4gYXJyYXlcblx0XHRsZXQgc3R5bGVzQXJyYXkgPSBPYmplY3Qua2V5cyh0ZXh0U3R5bGVzKS5tYXAoKGtleSkgPT4gdGV4dFN0eWxlc1trZXldKTtcblxuXHRcdGxldCBtYXhTdHJva2VUaGlja25lc3MgPSBzdHlsZXNBcnJheS5yZWR1Y2UoKHByZXYsIGN1cikgPT4gTWF0aC5tYXgocHJldiwgY3VyLnN0cm9rZVRoaWNrbmVzcyB8fCAwKSwgMCk7XG5cblx0XHRsZXQgZHJvcFNoYWRvd1BhZGRpbmcgPSB0aGlzLmdldERyb3BTaGFkb3dQYWRkaW5nKCk7XG5cblx0XHRsZXQgdG90YWxIZWlnaHQgPSBsaW5lWU1heHMucmVkdWNlKChwcmV2LCBjdXIpID0+IHByZXYgKyBjdXIsIDApIC0gbGluZVlNaW5zLnJlZHVjZSgocHJldiwgY3VyKSA9PiBwcmV2ICsgY3VyLCAwKTtcblxuXHRcdC8vIGRlZmluZSB0aGUgcmlnaHQgd2lkdGggYW5kIGhlaWdodFxuXHRcdGxldCB3aWR0aCA9IG1heExpbmVXaWR0aCArIG1heFN0cm9rZVRoaWNrbmVzcyArIDIgKiBkcm9wU2hhZG93UGFkZGluZztcblx0XHRsZXQgaGVpZ2h0ID0gdG90YWxIZWlnaHQgKyAyICogZHJvcFNoYWRvd1BhZGRpbmc7XG5cblx0XHR0aGlzLmNhbnZhcy53aWR0aCA9ICh3aWR0aCArIHRoaXMuY29udGV4dC5saW5lV2lkdGgpICogdGhpcy5yZXNvbHV0aW9uO1xuXHRcdHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodCAqIHRoaXMucmVzb2x1dGlvbjtcblxuXHRcdHRoaXMuY29udGV4dC5zY2FsZSh0aGlzLnJlc29sdXRpb24sIHRoaXMucmVzb2x1dGlvbik7XG5cblx0XHR0aGlzLmNvbnRleHQudGV4dEJhc2VsaW5lID0gXCJhbHBoYWJldGljXCI7XG5cdFx0dGhpcy5jb250ZXh0LmxpbmVKb2luID0gXCJyb3VuZFwiO1xuXG5cdFx0bGV0IGJhc2VQb3NpdGlvblkgPSBkcm9wU2hhZG93UGFkZGluZztcblxuXHRcdGxldCBkcmF3aW5nRGF0YTogVGV4dERyYXdpbmdEYXRhW10gPSBbXTtcblxuXHRcdC8vIENvbXB1dGUgdGhlIGRyYXdpbmcgZGF0YVxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgb3V0cHV0VGV4dERhdGEubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBsaW5lID0gb3V0cHV0VGV4dERhdGFbaV07XG5cdFx0XHRsZXQgbGluZVBvc2l0aW9uWDogbnVtYmVyO1xuXG5cdFx0XHRzd2l0Y2ggKHRoaXMuX3N0eWxlLmFsaWduKSB7XG5cdFx0XHRcdGNhc2UgXCJsZWZ0XCI6XG5cdFx0XHRcdFx0bGluZVBvc2l0aW9uWCA9IGRyb3BTaGFkb3dQYWRkaW5nO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgXCJjZW50ZXJcIjpcblx0XHRcdFx0XHRsaW5lUG9zaXRpb25YID0gZHJvcFNoYWRvd1BhZGRpbmcgKyAobWF4TGluZVdpZHRoIC0gbGluZVdpZHRoc1tpXSkgLyAyO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgXCJyaWdodFwiOlxuXHRcdFx0XHRcdGxpbmVQb3NpdGlvblggPSBkcm9wU2hhZG93UGFkZGluZyArIG1heExpbmVXaWR0aCAtIGxpbmVXaWR0aHNbaV07XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgbGluZS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRsZXQgeyBzdHlsZSwgdGV4dCwgZm9udFByb3BlcnRpZXMsIHdpZHRoLCBoZWlnaHQsIHRhZyB9ID0gbGluZVtqXTtcblxuXHRcdFx0XHRsaW5lUG9zaXRpb25YICs9IG1heFN0cm9rZVRoaWNrbmVzcyAvIDI7XG5cblx0XHRcdFx0bGV0IGxpbmVQb3NpdGlvblkgPSBtYXhTdHJva2VUaGlja25lc3MgLyAyICsgYmFzZVBvc2l0aW9uWSArIGZvbnRQcm9wZXJ0aWVzLmFzY2VudDtcblxuXHRcdFx0XHRzd2l0Y2ggKHN0eWxlLnZhbGlnbikge1xuXHRcdFx0XHRcdGNhc2UgXCJ0b3BcIjpcblx0XHRcdFx0XHRcdC8vIG5vIG5lZWQgdG8gZG8gYW55dGhpbmdcblx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0Y2FzZSBcImJhc2VsaW5lXCI6XG5cdFx0XHRcdFx0XHRsaW5lUG9zaXRpb25ZICs9IGxpbmVZTWF4c1tpXSAtIGZvbnRQcm9wZXJ0aWVzLmFzY2VudDtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0Y2FzZSBcIm1pZGRsZVwiOlxuXHRcdFx0XHRcdFx0bGluZVBvc2l0aW9uWSArPSAobGluZVlNYXhzW2ldIC0gbGluZVlNaW5zW2ldIC0gZm9udFByb3BlcnRpZXMuYXNjZW50IC0gZm9udFByb3BlcnRpZXMuZGVzY2VudCkgLyAyO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRjYXNlIFwiYm90dG9tXCI6XG5cdFx0XHRcdFx0XHRsaW5lUG9zaXRpb25ZICs9IGxpbmVZTWF4c1tpXSAtIGxpbmVZTWluc1tpXSAtIGZvbnRQcm9wZXJ0aWVzLmFzY2VudCAtIGZvbnRQcm9wZXJ0aWVzLmRlc2NlbnQ7XG5cdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHQvLyBBIG51bWJlciAtIG9mZnNldCBmcm9tIGJhc2VsaW5lLCBwb3NpdGl2ZSBpcyBoaWdoZXJcblx0XHRcdFx0XHRcdGxpbmVQb3NpdGlvblkgKz0gbGluZVlNYXhzW2ldIC0gZm9udFByb3BlcnRpZXMuYXNjZW50IC0gc3R5bGUudmFsaWduO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoc3R5bGUubGV0dGVyU3BhY2luZyA9PT0gMCkge1xuXHRcdFx0XHRcdGRyYXdpbmdEYXRhLnB1c2goe1xuXHRcdFx0XHRcdFx0dGV4dCxcblx0XHRcdFx0XHRcdHN0eWxlLFxuXHRcdFx0XHRcdFx0eDogbGluZVBvc2l0aW9uWCxcblx0XHRcdFx0XHRcdHk6IGxpbmVQb3NpdGlvblksXG5cdFx0XHRcdFx0XHR3aWR0aCxcblx0XHRcdFx0XHRcdGFzY2VudDogZm9udFByb3BlcnRpZXMuYXNjZW50LFxuXHRcdFx0XHRcdFx0ZGVzY2VudDogZm9udFByb3BlcnRpZXMuZGVzY2VudCxcblx0XHRcdFx0XHRcdHRhZ1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0bGluZVBvc2l0aW9uWCArPSBsaW5lW2pdLndpZHRoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuY29udGV4dC5mb250ID0gdGhpcy5nZXRGb250U3RyaW5nKGxpbmVbal0uc3R5bGUpO1xuXG5cdFx0XHRcdFx0Zm9yIChsZXQgayA9IDA7IGsgPCB0ZXh0Lmxlbmd0aDsgaysrKSB7XG5cdFx0XHRcdFx0XHRpZiAoayA+IDAgfHwgaiA+IDApIHtcblx0XHRcdFx0XHRcdFx0bGluZVBvc2l0aW9uWCArPSBzdHlsZS5sZXR0ZXJTcGFjaW5nIC8gMjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0ZHJhd2luZ0RhdGEucHVzaCh7XG5cdFx0XHRcdFx0XHRcdHRleHQ6IHRleHQuY2hhckF0KGspLFxuXHRcdFx0XHRcdFx0XHRzdHlsZSxcblx0XHRcdFx0XHRcdFx0eDogbGluZVBvc2l0aW9uWCxcblx0XHRcdFx0XHRcdFx0eTogbGluZVBvc2l0aW9uWSxcblx0XHRcdFx0XHRcdFx0d2lkdGgsXG5cdFx0XHRcdFx0XHRcdGFzY2VudDogZm9udFByb3BlcnRpZXMuYXNjZW50LFxuXHRcdFx0XHRcdFx0XHRkZXNjZW50OiBmb250UHJvcGVydGllcy5kZXNjZW50LFxuXHRcdFx0XHRcdFx0XHR0YWdcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRsaW5lUG9zaXRpb25YICs9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dCh0ZXh0LmNoYXJBdChrKSkud2lkdGg7XG5cblx0XHRcdFx0XHRcdGlmIChrIDwgdGV4dC5sZW5ndGggLSAxIHx8IGogPCBsaW5lLmxlbmd0aCAtIDEpIHtcblx0XHRcdFx0XHRcdFx0bGluZVBvc2l0aW9uWCArPSBzdHlsZS5sZXR0ZXJTcGFjaW5nIC8gMjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsaW5lUG9zaXRpb25YIC09IG1heFN0cm9rZVRoaWNrbmVzcyAvIDI7XG5cdFx0XHR9XG5cblx0XHRcdGJhc2VQb3NpdGlvblkgKz0gbGluZVlNYXhzW2ldIC0gbGluZVlNaW5zW2ldO1xuXHRcdH1cblxuXHRcdHRoaXMuY29udGV4dC5zYXZlKCk7XG5cblx0XHQvLyBGaXJzdCBwYXNzOiBkcmF3IHRoZSBzaGFkb3dzIG9ubHlcblx0XHRkcmF3aW5nRGF0YS5mb3JFYWNoKCh7IHN0eWxlLCB0ZXh0LCB4LCB5IH0pID0+IHtcblx0XHRcdGlmICghc3R5bGUuZHJvcFNoYWRvdykge1xuXHRcdFx0XHRyZXR1cm47IC8vIFRoaXMgdGV4dCBkb2Vzbid0IGhhdmUgYSBzaGFkb3dcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5jb250ZXh0LmZvbnQgPSB0aGlzLmdldEZvbnRTdHJpbmcoc3R5bGUpO1xuXG5cdFx0XHRsZXQgZHJvcEZpbGxTdHlsZSA9IHN0eWxlLmRyb3BTaGFkb3dDb2xvcjtcblx0XHRcdGlmICh0eXBlb2YgZHJvcEZpbGxTdHlsZSA9PT0gXCJudW1iZXJcIikge1xuXHRcdFx0XHRkcm9wRmlsbFN0eWxlID0gUElYSS51dGlscy5oZXgyc3RyaW5nKGRyb3BGaWxsU3R5bGUpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5jb250ZXh0LnNoYWRvd0NvbG9yID0gZHJvcEZpbGxTdHlsZTtcblx0XHRcdHRoaXMuY29udGV4dC5zaGFkb3dCbHVyID0gc3R5bGUuZHJvcFNoYWRvd0JsdXI7XG5cdFx0XHR0aGlzLmNvbnRleHQuc2hhZG93T2Zmc2V0WCA9IE1hdGguY29zKHN0eWxlLmRyb3BTaGFkb3dBbmdsZSkgKiBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UgKiB0aGlzLnJlc29sdXRpb247XG5cdFx0XHR0aGlzLmNvbnRleHQuc2hhZG93T2Zmc2V0WSA9IE1hdGguc2luKHN0eWxlLmRyb3BTaGFkb3dBbmdsZSkgKiBzdHlsZS5kcm9wU2hhZG93RGlzdGFuY2UgKiB0aGlzLnJlc29sdXRpb247XG5cblx0XHRcdHRoaXMuY29udGV4dC5maWxsVGV4dCh0ZXh0LCB4LCB5KTtcblx0XHR9KTtcblxuXHRcdHRoaXMuY29udGV4dC5yZXN0b3JlKCk7XG5cblx0XHQvLyBTZWNvbmQgcGFzczogZHJhdyBzdHJva2VzIGFuZCBmaWxsc1xuXHRcdGRyYXdpbmdEYXRhLmZvckVhY2goKHsgc3R5bGUsIHRleHQsIHgsIHksIHdpZHRoLCBhc2NlbnQsIGRlc2NlbnQsIHRhZyB9KSA9PiB7XG5cdFx0XHR0aGlzLmNvbnRleHQuZm9udCA9IHRoaXMuZ2V0Rm9udFN0cmluZyhzdHlsZSk7XG5cblx0XHRcdGxldCBzdHJva2VTdHlsZSA9IHN0eWxlLnN0cm9rZTtcblx0XHRcdGlmICh0eXBlb2Ygc3Ryb2tlU3R5bGUgPT09IFwibnVtYmVyXCIpIHtcblx0XHRcdFx0c3Ryb2tlU3R5bGUgPSBQSVhJLnV0aWxzLmhleDJzdHJpbmcoc3Ryb2tlU3R5bGUpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBzdHJva2VTdHlsZTtcblx0XHRcdHRoaXMuY29udGV4dC5saW5lV2lkdGggPSBzdHlsZS5zdHJva2VUaGlja25lc3M7XG5cblx0XHRcdC8vIHNldCBjYW52YXMgdGV4dCBzdHlsZXNcblx0XHRcdGxldCBmaWxsU3R5bGUgPSBzdHlsZS5maWxsO1xuXHRcdFx0aWYgKHR5cGVvZiBmaWxsU3R5bGUgPT09IFwibnVtYmVyXCIpIHtcblx0XHRcdFx0ZmlsbFN0eWxlID0gUElYSS51dGlscy5oZXgyc3RyaW5nKGZpbGxTdHlsZSk7XG5cdFx0XHR9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZmlsbFN0eWxlKSkge1xuXHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGZpbGxTdHlsZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGxldCBmaWxsID0gZmlsbFN0eWxlW2ldO1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgZmlsbCA9PT0gXCJudW1iZXJcIikge1xuXHRcdFx0XHRcdFx0ZmlsbFN0eWxlW2ldID0gUElYSS51dGlscy5oZXgyc3RyaW5nKGZpbGwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuX2dlbmVyYXRlRmlsbFN0eWxlKG5ldyBQSVhJLlRleHRTdHlsZShzdHlsZSksIFt0ZXh0XSkgYXMgc3RyaW5nIHwgQ2FudmFzR3JhZGllbnQ7XG5cdFx0XHQvLyBUeXBlY2FzdCByZXF1aXJlZCBmb3IgcHJvcGVyIHR5cGVjaGVja2luZ1xuXG5cdFx0XHRpZiAoc3R5bGUuc3Ryb2tlICYmIHN0eWxlLnN0cm9rZVRoaWNrbmVzcykge1xuXHRcdFx0XHR0aGlzLmNvbnRleHQuc3Ryb2tlVGV4dCh0ZXh0LCB4LCB5KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN0eWxlLmZpbGwpIHtcblx0XHRcdFx0dGhpcy5jb250ZXh0LmZpbGxUZXh0KHRleHQsIHgsIHkpO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgb2Zmc2V0ID0gLXRoaXMuX3N0eWxlLnBhZGRpbmcgLSB0aGlzLmdldERyb3BTaGFkb3dQYWRkaW5nKCk7XG5cblx0XHRcdHRoaXMuaGl0Ym94ZXMucHVzaCh7XG5cdFx0XHRcdHRhZyxcblx0XHRcdFx0aGl0Ym94OiBuZXcgUElYSS5SZWN0YW5nbGUoeCArIG9mZnNldCwgeSAtIGFzY2VudCArIG9mZnNldCwgd2lkdGgsIGFzY2VudCArIGRlc2NlbnQpXG5cdFx0XHR9KTtcblxuXHRcdFx0bGV0IGRlYnVnU3BhbiA9IHN0eWxlLmRlYnVnID09PSB1bmRlZmluZWRcblx0XHRcdFx0PyBNdWx0aVN0eWxlVGV4dC5kZWJ1Z09wdGlvbnMuc3BhbnMuZW5hYmxlZFxuXHRcdFx0XHQ6IHN0eWxlLmRlYnVnO1xuXG5cdFx0XHRpZiAoZGVidWdTcGFuKSB7XG5cdFx0XHRcdHRoaXMuY29udGV4dC5saW5lV2lkdGggPSAxO1xuXG5cdFx0XHRcdGlmIChNdWx0aVN0eWxlVGV4dC5kZWJ1Z09wdGlvbnMuc3BhbnMuYm91bmRpbmcpIHtcblx0XHRcdFx0XHR0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gTXVsdGlTdHlsZVRleHQuZGVidWdPcHRpb25zLnNwYW5zLmJvdW5kaW5nO1xuXHRcdFx0XHRcdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IE11bHRpU3R5bGVUZXh0LmRlYnVnT3B0aW9ucy5zcGFucy5ib3VuZGluZztcblx0XHRcdFx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LnJlY3QoeCwgeSAtIGFzY2VudCwgd2lkdGgsIGFzY2VudCArIGRlc2NlbnQpO1xuXHRcdFx0XHRcdHRoaXMuY29udGV4dC5maWxsKCk7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LnN0cm9rZSgpO1xuXHRcdFx0XHRcdHRoaXMuY29udGV4dC5zdHJva2UoKTsgLy8geWVzLCB0d2ljZVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKE11bHRpU3R5bGVUZXh0LmRlYnVnT3B0aW9ucy5zcGFucy5iYXNlbGluZSkge1xuXHRcdFx0XHRcdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IE11bHRpU3R5bGVUZXh0LmRlYnVnT3B0aW9ucy5zcGFucy5iYXNlbGluZTtcblx0XHRcdFx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0Lm1vdmVUbyh4LCB5KTtcblx0XHRcdFx0XHR0aGlzLmNvbnRleHQubGluZVRvKHggKyB3aWR0aCwgeSk7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdHRoaXMuY29udGV4dC5zdHJva2UoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChNdWx0aVN0eWxlVGV4dC5kZWJ1Z09wdGlvbnMuc3BhbnMudG9wKSB7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gTXVsdGlTdHlsZVRleHQuZGVidWdPcHRpb25zLnNwYW5zLnRvcDtcblx0XHRcdFx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0Lm1vdmVUbyh4LCB5IC0gYXNjZW50KTtcblx0XHRcdFx0XHR0aGlzLmNvbnRleHQubGluZVRvKHggKyB3aWR0aCwgeSAtIGFzY2VudCk7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdHRoaXMuY29udGV4dC5zdHJva2UoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChNdWx0aVN0eWxlVGV4dC5kZWJ1Z09wdGlvbnMuc3BhbnMuYm90dG9tKSB7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gTXVsdGlTdHlsZVRleHQuZGVidWdPcHRpb25zLnNwYW5zLmJvdHRvbTtcblx0XHRcdFx0XHR0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0Lm1vdmVUbyh4LCB5ICsgZGVzY2VudCk7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LmxpbmVUbyh4ICsgd2lkdGgsIHkgKyBkZXNjZW50KTtcblx0XHRcdFx0XHR0aGlzLmNvbnRleHQuY2xvc2VQYXRoKCk7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LnN0cm9rZSgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKE11bHRpU3R5bGVUZXh0LmRlYnVnT3B0aW9ucy5zcGFucy50ZXh0KSB7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IFwiI2ZmZmZmZlwiO1xuXHRcdFx0XHRcdHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IFwiIzAwMDAwMFwiO1xuXHRcdFx0XHRcdHRoaXMuY29udGV4dC5saW5lV2lkdGggPSAyO1xuXHRcdFx0XHRcdHRoaXMuY29udGV4dC5mb250ID0gXCI4cHggbW9ub3NwYWNlXCI7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LnN0cm9rZVRleHQodGFnLm5hbWUsIHgsIHkgLSBhc2NlbnQgKyA4KTtcblx0XHRcdFx0XHR0aGlzLmNvbnRleHQuZmlsbFRleHQodGFnLm5hbWUsIHgsIHkgLSBhc2NlbnQgKyA4KTtcblx0XHRcdFx0XHR0aGlzLmNvbnRleHQuc3Ryb2tlVGV4dChgJHt3aWR0aC50b0ZpeGVkKDIpfXgkeyhhc2NlbnQgKyBkZXNjZW50KS50b0ZpeGVkKDIpfWAsIHgsIHkgLSBhc2NlbnQgKyAxNik7XG5cdFx0XHRcdFx0dGhpcy5jb250ZXh0LmZpbGxUZXh0KGAke3dpZHRoLnRvRml4ZWQoMil9eCR7KGFzY2VudCArIGRlc2NlbnQpLnRvRml4ZWQoMil9YCwgeCwgeSAtIGFzY2VudCArIDE2KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0aWYgKE11bHRpU3R5bGVUZXh0LmRlYnVnT3B0aW9ucy5vYmplY3RzLmVuYWJsZWQpIHtcblx0XHRcdGlmIChNdWx0aVN0eWxlVGV4dC5kZWJ1Z09wdGlvbnMub2JqZWN0cy5ib3VuZGluZykge1xuXHRcdFx0XHR0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gTXVsdGlTdHlsZVRleHQuZGVidWdPcHRpb25zLm9iamVjdHMuYm91bmRpbmc7XG5cdFx0XHRcdHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRcdFx0dGhpcy5jb250ZXh0LnJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cdFx0XHRcdHRoaXMuY29udGV4dC5maWxsKCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChNdWx0aVN0eWxlVGV4dC5kZWJ1Z09wdGlvbnMub2JqZWN0cy50ZXh0KSB7XG5cdFx0XHRcdHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSBcIiNmZmZmZmZcIjtcblx0XHRcdFx0dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG5cdFx0XHRcdHRoaXMuY29udGV4dC5saW5lV2lkdGggPSAyO1xuXHRcdFx0XHR0aGlzLmNvbnRleHQuZm9udCA9IFwiOHB4IG1vbm9zcGFjZVwiO1xuXHRcdFx0XHR0aGlzLmNvbnRleHQuc3Ryb2tlVGV4dChgJHt3aWR0aC50b0ZpeGVkKDIpfXgke2hlaWdodC50b0ZpeGVkKDIpfWAsIDAsIDgsIHdpZHRoKTtcblx0XHRcdFx0dGhpcy5jb250ZXh0LmZpbGxUZXh0KGAke3dpZHRoLnRvRml4ZWQoMil9eCR7aGVpZ2h0LnRvRml4ZWQoMil9YCwgMCwgOCwgd2lkdGgpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMudXBkYXRlVGV4dHVyZSgpO1xuXHR9XG5cblx0cHJvdGVjdGVkIHdvcmRXcmFwKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0Ly8gR3JlZWR5IHdyYXBwaW5nIGFsZ29yaXRobSB0aGF0IHdpbGwgd3JhcCB3b3JkcyBhcyB0aGUgbGluZSBncm93cyBsb25nZXIgdGhhbiBpdHMgaG9yaXpvbnRhbCBib3VuZHMuXG5cdFx0bGV0IHJlc3VsdCA9IFwiXCI7XG5cdFx0bGV0IHJlID0gdGhpcy5nZXRUYWdSZWdleCh0cnVlLCB0cnVlKTtcblxuXHRcdGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdChcIlxcblwiKTtcblx0XHRjb25zdCB3b3JkV3JhcFdpZHRoID0gdGhpcy5fc3R5bGUud29yZFdyYXBXaWR0aDtcblx0XHRsZXQgc3R5bGVTdGFjayA9IFt0aGlzLmFzc2lnbih7fSwgdGhpcy50ZXh0U3R5bGVzW1wiZGVmYXVsdFwiXSldO1xuXHRcdHRoaXMuY29udGV4dC5mb250ID0gdGhpcy5nZXRGb250U3RyaW5nKHRoaXMudGV4dFN0eWxlc1tcImRlZmF1bHRcIl0pO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IHNwYWNlTGVmdCA9IHdvcmRXcmFwV2lkdGg7XG5cdFx0XHRjb25zdCB0YWdTcGxpdCA9IGxpbmVzW2ldLnNwbGl0KHJlKTtcblx0XHRcdGxldCBmaXJzdFdvcmRPZkxpbmUgPSB0cnVlO1xuXG5cdFx0XHRmb3IgKGxldCBqID0gMDsgaiA8IHRhZ1NwbGl0Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmIChyZS50ZXN0KHRhZ1NwbGl0W2pdKSkge1xuXHRcdFx0XHRcdHJlc3VsdCArPSB0YWdTcGxpdFtqXTtcblx0XHRcdFx0XHRpZiAodGFnU3BsaXRbal1bMV0gPT09IFwiL1wiKSB7XG5cdFx0XHRcdFx0XHRqICs9IDI7XG5cdFx0XHRcdFx0XHRzdHlsZVN0YWNrLnBvcCgpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRqKys7XG5cdFx0XHRcdFx0XHRzdHlsZVN0YWNrLnB1c2godGhpcy5hc3NpZ24oe30sIHN0eWxlU3RhY2tbc3R5bGVTdGFjay5sZW5ndGggLSAxXSwgdGhpcy50ZXh0U3R5bGVzW3RhZ1NwbGl0W2pdXSkpO1xuXHRcdFx0XHRcdFx0aisrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLmNvbnRleHQuZm9udCA9IHRoaXMuZ2V0Rm9udFN0cmluZyhzdHlsZVN0YWNrW3N0eWxlU3RhY2subGVuZ3RoIC0gMV0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnN0IHdvcmRzID0gdGFnU3BsaXRbal0uc3BsaXQoXCIgXCIpO1xuXG5cdFx0XHRcdFx0Zm9yIChsZXQgayA9IDA7IGsgPCB3b3Jkcy5sZW5ndGg7IGsrKykge1xuXHRcdFx0XHRcdFx0Y29uc3Qgd29yZFdpZHRoID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KHdvcmRzW2tdKS53aWR0aDtcblxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuX3N0eWxlLmJyZWFrV29yZHMgJiYgd29yZFdpZHRoID4gc3BhY2VMZWZ0KSB7XG5cdFx0XHRcdFx0XHRcdC8vIFBhcnQgc2hvdWxkIGJlIHNwbGl0IGluIHRoZSBtaWRkbGVcblx0XHRcdFx0XHRcdFx0Y29uc3QgY2hhcmFjdGVycyA9IHdvcmRzW2tdLnNwbGl0KCcnKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAoayA+IDApIHtcblx0XHRcdFx0XHRcdFx0XHRyZXN1bHQgKz0gXCIgXCI7XG5cdFx0XHRcdFx0XHRcdFx0c3BhY2VMZWZ0IC09IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChcIiBcIikud2lkdGg7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRmb3IgKGxldCBjID0gMDsgYyA8IGNoYXJhY3RlcnMubGVuZ3RoOyBjKyspIHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBjaGFyYWN0ZXJXaWR0aCA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChjaGFyYWN0ZXJzW2NdKS53aWR0aDtcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChjaGFyYWN0ZXJXaWR0aCA+IHNwYWNlTGVmdCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0cmVzdWx0ICs9IGBcXG4ke2NoYXJhY3RlcnNbY119YDtcblx0XHRcdFx0XHRcdFx0XHRcdHNwYWNlTGVmdCA9IHdvcmRXcmFwV2lkdGggLSBjaGFyYWN0ZXJXaWR0aDtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0cmVzdWx0ICs9IGNoYXJhY3RlcnNbY107XG5cdFx0XHRcdFx0XHRcdFx0XHRzcGFjZUxlZnQgLT0gY2hhcmFjdGVyV2lkdGg7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYodGhpcy5fc3R5bGUuYnJlYWtXb3Jkcykge1xuXHRcdFx0XHRcdFx0XHRyZXN1bHQgKz0gd29yZHNba107XG5cdFx0XHRcdFx0XHRcdHNwYWNlTGVmdCAtPSB3b3JkV2lkdGg7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBwYWRkZWRXb3JkV2lkdGggPVxuXHRcdFx0XHRcdFx0XHRcdHdvcmRXaWR0aCArIChrID4gMCA/IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChcIiBcIikud2lkdGggOiAwKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAocGFkZGVkV29yZFdpZHRoID4gc3BhY2VMZWZ0KSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gU2tpcCBwcmludGluZyB0aGUgbmV3bGluZSBpZiBpdCdzIHRoZSBmaXJzdCB3b3JkIG9mIHRoZSBsaW5lIHRoYXQgaXNcblx0XHRcdFx0XHRcdFx0XHQvLyBncmVhdGVyIHRoYW4gdGhlIHdvcmQgd3JhcCB3aWR0aC5cblx0XHRcdFx0XHRcdFx0XHRpZiAoIWZpcnN0V29yZE9mTGluZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0cmVzdWx0ICs9IFwiXFxuXCI7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0ICs9IHdvcmRzW2tdO1xuXHRcdFx0XHRcdFx0XHRcdHNwYWNlTGVmdCA9IHdvcmRXcmFwV2lkdGggLSB3b3JkV2lkdGg7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0c3BhY2VMZWZ0IC09IHBhZGRlZFdvcmRXaWR0aDtcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChrID4gMCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0cmVzdWx0ICs9IFwiIFwiO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCArPSB3b3Jkc1trXTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Zmlyc3RXb3JkT2ZMaW5lID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChpIDwgbGluZXMubGVuZ3RoIC0gMSkge1xuXHRcdFx0XHRyZXN1bHQgKz0gJ1xcbic7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdHByb3RlY3RlZCB1cGRhdGVUZXh0dXJlKCkge1xuXHRcdGNvbnN0IHRleHR1cmUgPSB0aGlzLl90ZXh0dXJlO1xuXG5cdFx0bGV0IGRyb3BTaGFkb3dQYWRkaW5nID0gdGhpcy5nZXREcm9wU2hhZG93UGFkZGluZygpO1xuXG5cdFx0dGV4dHVyZS5iYXNlVGV4dHVyZS5oYXNMb2FkZWQgPSB0cnVlO1xuXHRcdHRleHR1cmUuYmFzZVRleHR1cmUucmVzb2x1dGlvbiA9IHRoaXMucmVzb2x1dGlvbjtcblxuXHRcdHRleHR1cmUuYmFzZVRleHR1cmUucmVhbFdpZHRoID0gdGhpcy5jYW52YXMud2lkdGg7XG5cdFx0dGV4dHVyZS5iYXNlVGV4dHVyZS5yZWFsSGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0O1xuXHRcdHRleHR1cmUuYmFzZVRleHR1cmUud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMucmVzb2x1dGlvbjtcblx0XHR0ZXh0dXJlLmJhc2VUZXh0dXJlLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCAvIHRoaXMucmVzb2x1dGlvbjtcblx0XHR0ZXh0dXJlLnRyaW0ud2lkdGggPSB0ZXh0dXJlLmZyYW1lLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGggLyB0aGlzLnJlc29sdXRpb247XG5cdFx0dGV4dHVyZS50cmltLmhlaWdodCA9IHRleHR1cmUuZnJhbWUuaGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0IC8gdGhpcy5yZXNvbHV0aW9uO1xuXG5cdFx0dGV4dHVyZS50cmltLnggPSAtdGhpcy5fc3R5bGUucGFkZGluZyAtIGRyb3BTaGFkb3dQYWRkaW5nO1xuXHRcdHRleHR1cmUudHJpbS55ID0gLXRoaXMuX3N0eWxlLnBhZGRpbmcgLSBkcm9wU2hhZG93UGFkZGluZztcblxuXHRcdHRleHR1cmUub3JpZy53aWR0aCA9IHRleHR1cmUuZnJhbWUud2lkdGggLSAodGhpcy5fc3R5bGUucGFkZGluZyArIGRyb3BTaGFkb3dQYWRkaW5nKSAqIDI7XG5cdFx0dGV4dHVyZS5vcmlnLmhlaWdodCA9IHRleHR1cmUuZnJhbWUuaGVpZ2h0IC0gKHRoaXMuX3N0eWxlLnBhZGRpbmcgKyBkcm9wU2hhZG93UGFkZGluZykgKiAyO1xuXG5cdFx0Ly8gY2FsbCBzcHJpdGUgb25UZXh0dXJlVXBkYXRlIHRvIHVwZGF0ZSBzY2FsZSBpZiBfd2lkdGggb3IgX2hlaWdodCB3ZXJlIHNldFxuXHRcdHRoaXMuX29uVGV4dHVyZVVwZGF0ZSgpO1xuXG5cdFx0dGV4dHVyZS5iYXNlVGV4dHVyZS5lbWl0KCd1cGRhdGUnLCB0ZXh0dXJlLmJhc2VUZXh0dXJlKTtcblxuXHRcdHRoaXMuZGlydHkgPSBmYWxzZTtcblx0fVxuXG5cdC8vIExhenkgZmlsbCBmb3IgT2JqZWN0LmFzc2lnblxuXHRwcml2YXRlIGFzc2lnbihkZXN0aW5hdGlvbjogYW55LCAuLi5zb3VyY2VzOiBhbnlbXSk6IGFueSB7XG5cdFx0Zm9yIChsZXQgc291cmNlIG9mIHNvdXJjZXMpIHtcblx0XHRcdGZvciAobGV0IGtleSBpbiBzb3VyY2UpIHtcblx0XHRcdFx0ZGVzdGluYXRpb25ba2V5XSA9IHNvdXJjZVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBkZXN0aW5hdGlvbjtcblx0fVxufVxuIl19
