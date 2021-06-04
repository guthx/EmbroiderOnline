import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { colorModes } from './Enums';

export default class ProjectRenderer {
    constructor(stitches, colors, width, height, element, stitchSize, lineWidth, settings) {
        this.stitches = stitches;
        this.colors = colors;
        this.stitchSize = stitchSize;
        this.lineWidth = lineWidth;
        this.spritesheet = null;
        this.stitchedTextures = null;
        this.unstitchedTextures = null;
        this.defaultScale = 64 / (stitchSize + lineWidth);
        this.scale = this.defaultScale;
        this.app = new PIXI.Application({
            width: width,
            height: height,
            view: element
        });
        this.app.renderer.plugins.interaction.interactionFrequency = 5;
        this.app.renderer.plugins.interaction.moveWhenInside = true;
        this.viewport = new Viewport({
            worldWidth: stitches[0].length * this.stitchSize + this.lineWidth,
            worldHeight: stitches.length * this.stitchSize + this.lineWidth,
            screenWidth: width,
            screenHeight: height,
            disableOnContextMenu: true,
            interaction: this.app.renderer.plugins.interaction,
        });
        this.app.stage.addChild(this.viewport);

        let background = this.viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        background.width = stitches[0].length * this.stitchSize;
        background.height = stitches.length * this.stitchSize;

        this.generateTextures(settings.colorMode, settings.colorLock, settings.selectedColor, settings.customColor);

        this.sprites = new Array(stitches.length);
        let i = 0;
        for (let y = 0; y < stitches.length; y++) {

            this.sprites[y] = new Array(stitches[0].length)
            for (let x = 0; x < stitches[0].length; x++) {
                if (stitches[y][x].stitched) {
                    this.sprites[y][x] = this.viewport.addChild(new PIXI.Sprite(this.stitchedTextures[stitches[y][x].colorIndex]));
                }
                else {
                    this.sprites[y][x] = this.viewport.addChild(new PIXI.Sprite(this.unstitchedTextures[stitches[y][x].colorIndex]));
                }
                this.sprites[y][x].width = this.sprites[y][x].height = this.stitchSize + this.lineWidth;
                this.sprites[y][x].position.set(x * this.stitchSize, y * this.stitchSize);
                this.sprites[y][x].visible = false;
                i++;
            }
        }
        this.linesY = [];
        this.linesX = [];
        i = 0;
        for (let y = 10; y < this.stitches.length; y += 10) {
            this.linesY[i] = this.viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            this.linesY[i].tint = 0x000000;
            this.linesY[i].width = stitches[0].length * this.stitchSize;
            this.linesY[i].height = this.lineWidth * 2;
            this.linesY[i].position.set(0, y * this.stitchSize - this.lineWidth);
            this.linesY[i].visible = false;
            i++;
        }
        i = 0;
        for (let x = 10; x < this.stitches[0].length; x += 10) {
            this.linesX[i] = this.viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            this.linesX[i].tint = 0x000000;
            this.linesX[i].height = stitches.length * this.stitchSize;
            this.linesX[i].width = this.lineWidth * 2;
            this.linesX[i].position.set(x * this.stitchSize - this.lineWidth, 0);
            this.linesX[i].visible = false;
            i++;
        }
        let minScale = this.viewport.findFit(this.viewport.worldWidth, this.viewport.worldHeight);
        this.viewport.clampZoom({
            minScale: minScale,
            maxScale: 1
        });
        this.viewport.setZoom(this.defaultScale);
        this.zoomRectangle = this.viewport.addChild(new PIXI.Graphics());
        this.zoomRectangle.lineStyle(4 / minScale, 0x000000);
        this.zoomRectangle.drawRect(0, 0, minScale * this.viewport.worldWidth / this.defaultScale, minScale * this.viewport.worldHeight / this.defaultScale);
        this.zoomRectangle.renderable = false;

        let miniatureCanvas = document.createElement('canvas');
        let miniatuteCtx = miniatureCanvas.getContext('2d');
        let minData = miniatuteCtx.createImageData(stitches[0].length, stitches.length);
        i = 0;
        for (let y = 0; y < stitches.length; y++)
            for (let x = 0; x < stitches[0].length; x++) {
                let color = colors[stitches[y][x].colorIndex];
                minData.data[i + 0] = color.red;
                minData.data[i + 1] = color.green;
                minData.data[i + 2] = color.blue;
                minData.data[i + 3] = 255;
                i += 4;
            }
        miniatureCanvas.width = stitches[0].length;
        miniatureCanvas.height = stitches.length;
        miniatuteCtx.putImageData(minData, 0, 0);
        let miniatureTexture = new PIXI.Texture.from(miniatureCanvas, { width: stitches[0].length, height: stitches.length });
        this.miniature = this.viewport.addChild(new PIXI.Sprite(miniatureTexture));
        this.miniature.width = stitches[0].length;
        this.miniature.height = stitches.length;
        this.miniature.position.set(0, 0);

        minData = null
        miniatureCanvas = null;
        this.app.stage.addChild(this.miniature);

        this.miniatureRect = this.miniature.addChild(new PIXI.Graphics());
        this.miniatureRect.lineStyle(2);
        this.miniatureRect.drawRect(0, 0, (this.viewport.screenWidth / this.viewport.worldWidth) * stitches[0].length,
            (this.viewport.screenHeight / this.viewport.worldHeight) * stitches.length);
        this.miniature.renderable = false;

        this.selectionRect = this.viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        this.selectionRect.tint = 0x000000;
        this.selectionRect.alpha = 0.5;
        this.selectionRect.renderable = false;

        this.initialCull(this.viewport.getVisibleBounds());
        this.prevBounds = this.initalBounds(this.viewport.getVisibleBounds());
        PIXI.Ticker.shared.add(() => {
            if (this.viewport.dirty) {
                this.cull(this.viewport.getVisibleBounds());
                this.viewport.dirty = false;
            }
        });

        this.viewport.drag({
            mouseButtons: 'right-left',
        });
        this.viewport.clamp({
            top: true,
            bottom: true,
            left: true,
            right: true
        });
        this.viewport.wheel();

        this.viewport.on('moved', e => {
            this.miniatureRect.position.set(
                (-e.viewport.lastViewport.x / this.scale / this.viewport.worldWidth) * this.miniature.width,
                (-e.viewport.lastViewport.y / this.scale / this.viewport.worldHeight) * this.miniature.height
            );
        });
        this.viewport.on('zoomed-end', e => {
            this.scale = this.viewport.lastViewport.scaleX;
            let width = ((this.viewport.screenWidth / this.viewport.worldWidth) * stitches[0].length) / this.scale;
            let height = ((this.viewport.screenHeight / this.viewport.worldHeight) * stitches.length) / this.scale;
            this.miniatureRect.clear();
            this.miniatureRect.lineStyle(2);
            this.miniatureRect.drawRect(0, 0, width, height);
            this.miniatureRect.position.set(
                (-e.lastViewport.x / this.scale / this.viewport.worldWidth) * this.miniature.width,
                (-e.lastViewport.y / this.scale / this.viewport.worldHeight) * this.miniature.height
            );
        });
        this.viewport.interactive = true;

        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

    }



    generateTextures(colorMode, colorLock, selectedColor, customColor) {
        if (!this.spritesheet) {
            let lineCount = Math.ceil((this.colors.length * 2 * (this.stitchSize + this.lineWidth)) / 2048);
            this.spritesheet = new PIXI.RenderTexture.create({ width: 2048, height: (this.stitchSize + this.lineWidth) * lineCount });
            this.stitchedTextures = new Array(this.colors.length);
            this.unstitchedTextures = new Array(this.colors.length);
        }
        let clearSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        clearSprite.width = this.spritesheet.width;
        clearSprite.height = this.spritesheet.height;
        clearSprite.alpha = 0;
        this.app.renderer.render(clearSprite, this.spritesheet, true);
        clearSprite.destroy();
        clearSprite = null;
        if (colorMode == colorModes.TRANSPARENT_TO_OPAQUE) {
            if (colorLock) {
                for (let i = 0; i < this.colors.length; i++) {
                    if (selectedColor == i) {
                        let color = this.colors[i];
                        let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                        const rect = new PIXI.Graphics();

                        rect.lineStyle({ width: this.lineWidth, color: 0x000000, alignment: 1 });
                        rect.beginFill(colorHex);
                        rect.drawRect(this.lineWidth, this.lineWidth, this.stitchSize - this.lineWidth, this.stitchSize - this.lineWidth);
                        rect.endFill();
                        const text = new PIXI.Text(i.toString(), {
                            fontFamily: 'Arial',
                            fontSize: this.stitchSize / 2,
                            fill: 0x000000,
                        });
                        text.anchor.set(0.5);
                        text.x = (this.stitchSize + this.lineWidth) / 2;
                        text.y = (this.stitchSize + this.lineWidth) / 2;
                        rect.addChild(text);
                        text.updateText();
                        let line = ~~(i * (this.stitchSize + this.lineWidth) / 2048);
                        let row = i % (~~(2048 / this.stitchSize));
                        rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                        this.app.renderer.render(rect, this.spritesheet, false);
                        this.stitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                            new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)));

                        rect.clear();
                        rect.lineStyle({ width: this.lineWidth, color: 0x000000, alignment: 1 });
                        rect.beginFill(colorHex, 0.4);
                        rect.drawRect(this.lineWidth, this.lineWidth, this.stitchSize - this.lineWidth, this.stitchSize - this.lineWidth);
                        rect.endFill();
                        text.alpha = 0.4;
                        text.updateText();
                        line = ~~((i + this.colors.length) * (this.stitchSize + this.lineWidth) / 2048);
                        row = (i + this.colors.length) % (~~(2048 / this.stitchSize));
                        rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                        this.app.renderer.render(rect, this.spritesheet, false);
                        this.unstitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                            new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)));
                        rect.destroy(true);
                    }
                    else {
                        let color = this.colors[i];
                        let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                        const rect = new PIXI.Graphics();

                        rect.lineStyle({ width: this.lineWidth, color: 0x000000, alpha: 0.2, alignment: 1 });
                        rect.beginFill(colorHex, 0.2);
                        rect.drawRect(this.lineWidth, this.lineWidth, this.stitchSize - this.lineWidth, this.stitchSize - this.lineWidth);
                        rect.endFill();
                        let line = ~~(i * (this.stitchSize + this.lineWidth) / 2048);
                        let row = i % (~~(2048 / this.stitchSize));
                        rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                        this.app.renderer.render(rect, this.spritesheet, false);
                        this.stitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                            new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)));

                        line = ~~((i + this.colors.length) * (this.stitchSize + this.lineWidth) / 2048);
                        row = (i + this.colors.length) % (~~(2048 / this.stitchSize));
                        rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                        this.app.renderer.render(rect, this.spritesheet, false);
                        this.unstitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                            new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)));

                        rect.destroy(true);
                    }

                }
            }
            else {
                for (let i = 0; i < this.colors.length; i++) {
                    let color = this.colors[i];
                    let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                    const rect = new PIXI.Graphics();

                    rect.lineStyle({ width: this.lineWidth, color: 0x000000, alignment: 1 });
                    rect.beginFill(colorHex);
                    rect.drawRect(this.lineWidth, this.lineWidth, this.stitchSize - this.lineWidth, this.stitchSize - this.lineWidth);
                    rect.endFill();
                    const text = new PIXI.Text(i.toString(), {
                        fontFamily: 'Arial',
                        fontSize: this.stitchSize / 2,
                        fill: 0x000000,
                    });
                    text.anchor.set(0.5);
                    text.x = (this.stitchSize + this.lineWidth) / 2;
                    text.y = (this.stitchSize + this.lineWidth) / 2;
                    rect.addChild(text);
                    text.updateText();
                    let line = ~~(i * (this.stitchSize + this.lineWidth) / 2048);
                    let row = i % (~~(2048 / this.stitchSize));
                    rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                    this.app.renderer.render(rect, this.spritesheet, false);
                    this.stitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                        new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)));

                    rect.clear();
                    rect.lineStyle({ width: this.lineWidth, color: 0x000000, alignment: 1 });
                    rect.beginFill(colorHex, 0.4);
                    rect.drawRect(this.lineWidth, this.lineWidth, this.stitchSize - this.lineWidth, this.stitchSize - this.lineWidth);
                    rect.endFill();
                    text.alpha = 0.4;
                    text.updateText();

                    line = ~~((i + this.colors.length) * (this.stitchSize + this.lineWidth) / 2048);
                    row = (i + this.colors.length) % (~~(2048 / this.stitchSize));
                    rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                    this.app.renderer.render(rect, this.spritesheet, false);
                    this.unstitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                        new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)));

                    rect.destroy(true);
                }
            }
        }
        else if (colorMode == colorModes.OPAQUE_TO_COLOR) {

            if (colorLock) {
                for (let i = 0; i < this.colors.length; i++) {
                    if (selectedColor == i) {
                        let color = this.colors[i];
                        let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                        const rect = new PIXI.Graphics();

                        rect.lineStyle({ width: this.lineWidth, color: 0x000000, alignment: 1 });
                        rect.beginFill(parseInt(`0x${customColor.slice(1, 7)}`, 16));
                        rect.drawRect(this.lineWidth, this.lineWidth, this.stitchSize - this.lineWidth, this.stitchSize - this.lineWidth);
                        rect.endFill();
                        const text = new PIXI.Text(i.toString(), {
                            fontFamily: 'Arial',
                            fontSize: this.stitchSize / 2,
                            fill: 0x000000,
                        });
                        text.anchor.set(0.5);
                        text.x = (this.stitchSize + this.lineWidth) / 2;
                        text.y = (this.stitchSize + this.lineWidth) / 2;
                        rect.addChild(text);
                        text.updateText();
                        let line = ~~(i * (this.stitchSize + this.lineWidth) / 2048);
                        let row = i % (~~(2048 / this.stitchSize));
                        rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                        this.app.renderer.render(rect, this.spritesheet, false);
                        this.stitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                            new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)));

                        rect.clear();
                        rect.lineStyle({ width: this.lineWidth, color: 0x000000, alignment: 1 });
                        rect.beginFill(colorHex);
                        rect.drawRect(this.lineWidth, this.lineWidth, this.stitchSize - this.lineWidth, this.stitchSize - this.lineWidth);
                        rect.endFill();
                        text.alpha = 0.4;
                        text.updateText();
                        line = ~~((i + this.colors.length) * (this.stitchSize + this.lineWidth) / 2048);
                        row = (i + this.colors.length) % (~~(2048 / this.stitchSize));
                        rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                        this.app.renderer.render(rect, this.spritesheet, false);
                        this.unstitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                            new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)));

                        rect.destroy(true);
                    }
                    else {
                        let color = this.colors[i];
                        let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                        const rect = new PIXI.Graphics();

                        rect.lineStyle({ width: this.lineWidth, color: 0x000000, alpha: 0.2, alignment: 1 });
                        rect.beginFill(colorHex, 0.2);
                        rect.drawRect(this.lineWidth, this.lineWidth, this.stitchSize - this.lineWidth, this.stitchSize - this.lineWidth);
                        rect.endFill();
                        let line = ~~(i * (this.stitchSize + this.lineWidth) / 2048);
                        let row = i % (~~(2048 / this.stitchSize));
                        rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                        this.app.renderer.render(rect, this.spritesheet, false);
                        this.stitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                            new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)));
                        line = ~~((i + this.colors.length) * (this.stitchSize + this.lineWidth) / 2048);
                        row = (i + this.colors.length) % (~~(2048 / this.stitchSize));
                        rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                        this.app.renderer.render(rect, this.spritesheet, false);
                        this.unstitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                            new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)))

                        rect.destroy(true);
                    }

                }
            }
            else {
                for (let i = 0; i < this.colors.length; i++) {
                    let color = this.colors[i];
                    let colorHex = (color.red << 16) + (color.green << 8) + color.blue;
                    const rect = new PIXI.Graphics();

                    rect.lineStyle({ width: this.lineWidth, color: 0x000000, alignment: 1 });
                    rect.beginFill(parseInt(`0x${customColor.slice(1, 7)}`, 16));
                    rect.drawRect(this.lineWidth, this.lineWidth, this.stitchSize - this.lineWidth, this.stitchSize - this.lineWidth);
                    rect.endFill();
                    const text = new PIXI.Text(i.toString(), {
                        fontFamily: 'Arial',
                        fontSize: this.stitchSize / 2,
                        fill: 0x000000,
                    });
                    text.anchor.set(0.5);
                    text.x = (this.stitchSize + this.lineWidth) / 2;
                    text.y = (this.stitchSize + this.lineWidth) / 2;
                    rect.addChild(text);
                    text.updateText();
                    let line = ~~(i * (this.stitchSize + this.lineWidth) / 2048);
                    let row = i % (~~(2048 / this.stitchSize));
                    rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                    this.app.renderer.render(rect, this.spritesheet, false);
                    this.stitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                        new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)));

                    rect.clear();
                    rect.lineStyle({ width: this.lineWidth, color: 0x000000, alignment: 1 });
                    rect.beginFill(colorHex);
                    rect.drawRect(this.lineWidth, this.lineWidth, this.stitchSize - this.lineWidth, this.stitchSize - this.lineWidth);
                    rect.endFill();
                    text.alpha = 0.4;
                    text.updateText();
                    line = ~~((i + this.colors.length) * (this.stitchSize + this.lineWidth) / 2048);
                    row = (i + this.colors.length) % (~~(2048 / this.stitchSize));
                    rect.position.set(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth));
                    this.app.renderer.render(rect, this.spritesheet, false);
                    this.unstitchedTextures[i] = new PIXI.Texture(this.spritesheet,
                        new PIXI.Rectangle(row * (this.stitchSize + this.lineWidth), line * (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth), (this.stitchSize + this.lineWidth)))

                    rect.destroy(true);
                }
            }

        }
    }

    cull(bounds) {
        let x1 = ~~(bounds.x / this.stitchSize);
        let x2 = ~~((bounds.x + bounds.width) / this.stitchSize);
        let y1 = ~~(bounds.y / this.stitchSize);
        let y2 = ~~((bounds.y + bounds.height) / this.stitchSize);
        if (x1 < 0)
            x1 = 0;
        if (y1 < 0)
            y1 = 0;
        if (x2 > this.stitches[0].length - 1)
            x2 = this.stitches[0].length - 1;
        if (y2 > this.stitches.length - 1)
            y2 = this.stitches.length - 1;

        let { stitchesRemove, stitchesAdd } = this.getStitches(this.prevBounds, { x1, y1, x2, y2 });
        if (stitchesRemove.length > 0 || stitchesAdd.length > 0) {
            for (let i = 0; i < stitchesRemove.length; i++)
                this.sprites[stitchesRemove[i].y][stitchesRemove[i].x].visible = false;
            for (let i = 0; i < stitchesAdd.length; i++)
                this.sprites[stitchesAdd[i].y][stitchesAdd[i].x].visible = true;
        }

        for (let x = this.prevBounds.x1 - this.prevBounds.x1 % 10; x < this.prevBounds.x2 - 10; x += 10) {
            this.linesX[x / 10].visible = false;
        }
        for (let y = this.prevBounds.y1 - this.prevBounds.y1 % 10; y < this.prevBounds.y2 - 10; y += 10) {
            this.linesY[y / 10].visible = false;
        }

        for (let x = x1 - x1 % 10; x < x2 - 10; x += 10) {
            this.linesX[x / 10].visible = true;
        }
        for (let y = y1 - y1 % 10; y < y2 - 10; y += 10) {
            this.linesY[y / 10].visible = true;
        }
        this.prevBounds = { x1, x2, y1, y2 };
    }

    getStitches(rect1, rect2) {
        let stitchesAdd = [];
        let stitchesRemove = [];

        if (rect1.x1 < rect2.x1) {
            for (let x = rect1.x1; x < rect2.x1; x++) {
                for (let y = rect1.y1; y <= rect1.y2; y++) {
                    stitchesRemove.push({ x, y });
                }
            }
        }

        if (rect1.x1 > rect2.x1) {
            for (let x = rect2.x1; x < rect1.x1; x++) {
                for (let y = rect2.y1; y <= rect2.y2; y++) {
                    stitchesAdd.push({ x, y });
                }
            }
        }

        if (rect1.x2 < rect2.x2) {
            for (let x = rect1.x2 + 1; x <= rect2.x2; x++) {
                for (let y = rect2.y1; y <= rect2.y2; y++) {
                    stitchesAdd.push({ x, y });
                }
            }
        }

        if (rect1.x2 > rect2.x2) {
            for (let x = rect2.x2 + 1; x <= rect1.x2; x++) {
                for (let y = rect1.y1; y <= rect1.y2; y++) {
                    stitchesRemove.push({ x, y });
                }
            }
        }

        if (rect1.y1 < rect2.y1) {
            for (let x = rect1.x1; x <= rect1.x2; x++) {
                for (let y = rect1.y1; y < rect2.y1; y++) {
                    stitchesRemove.push({ x, y });
                }
            }
        }

        if (rect1.y1 > rect2.y1) {
            for (let x = rect2.x1; x <= rect2.x2; x++) {
                for (let y = rect2.y1; y < rect1.y1; y++) {
                    stitchesAdd.push({ x, y });
                }
            }
        }

        if (rect1.y2 < rect2.y2) {
            for (let x = rect2.x1; x <= rect2.x2; x++) {
                for (let y = rect1.y2 + 1; y <= rect2.y2; y++) {
                    stitchesAdd.push({ x, y });
                }
            }
        }

        if (rect1.y2 > rect2.y2) {
            for (let x = rect1.x1; x <= rect1.x2; x++) {
                for (let y = rect2.y2 + 1; y <= rect1.y2; y++) {
                    stitchesRemove.push({ x, y });
                }
            }
        }

        return { stitchesRemove, stitchesAdd };
    }

    drawStitch = (x, y) => {
        let color = this.stitches[y][x].colorIndex;
        if (this.stitches[y][x].stitched)
            this.sprites[y][x].texture = this.stitchedTextures[color];
        else
            this.sprites[y][x].texture = this.unstitchedTextures[color];
    }

    zoomOut = () => {
        this.scale = this.viewport.findFit(this.viewport.worldWidth, this.viewport.worldHeight);
        this.viewport.setZoom(this.scale, true);
        //setGuideStyles();

        this.zoomRectangle.clear();
        this.zoomRectangle.lineStyle(4 / this.scale, 0x8a2be2);
        this.zoomRectangle.drawRect(0, 0, this.scale * this.viewport.worldWidth / this.defaultScale, this.scale * this.viewport.worldHeight / this.defaultScale);
        this.zoomRectangle.renderable = true;
    }

    zoomIn = (pos) => {
        this.scale = this.defaultScale;
       // this.setPrevCursorMode();
        this.viewport.setZoom(this.defaultScale, true);
        this.viewport.moveCenter(pos.x, pos.y);
       // setGuideStyles();
    }

    startSelection(x, y) {
        this.selectionPos = { x, y };
        this.selectionRect.position.set(x * this.stitchSize, y * this.stitchSize);
        this.selectionRect.width = this.selectionRect.height = this.stitchSize;
        this.selectionRect.renderable = true;
    }
    setSelection(x, y) {
        let scaleX = 1, scaleY = 1;
        this.selectionRect.width = (Math.abs(x - this.selectionPos.x) + 1) * (this.stitchSize);
        this.selectionRect.height = (Math.abs(y - this.selectionPos.y) + 1) * (this.stitchSize);
        if (x - this.selectionPos.x < 0) {
            scaleX = -1;
            this.selectionRect.position.x = (this.selectionPos.x + 1) * this.stitchSize;
        }
        else {
            this.selectionRect.position.x = (this.selectionPos.x) * this.stitchSize;
        }
        if (y - this.selectionPos.y < 0) {
            scaleY = -1;
            this.selectionRect.position.y = (this.selectionPos.y + 1) * this.stitchSize;
        }
        else {
            this.selectionRect.position.y = (this.selectionPos.y) * this.stitchSize;
        }   
        this.selectionRect.scale.x = Math.abs(this.selectionRect.scale.x) * scaleX;
        this.selectionRect.scale.y = Math.abs(this.selectionRect.scale.y) * scaleY;
    }
    removeSelection() {
        this.selectionRect.renderable = false;
    }


    setZoomRectanglePos(pos) {
        let bounds = {
            width: this.zoomRectangle.width,
            height: this.zoomRectangle.height
        };
        let rectX = pos.x - bounds.width / 2;
        if (rectX < 0)
            rectX = 0;
        else if (rectX > this.viewport.worldWidth - bounds.width)
            rectX = this.viewport.worldWidth - bounds.width;
        let rectY = pos.y - bounds.height / 2;
        if (rectY < 0)
            rectY = 0;
        else if (rectY > this.viewport.worldHeight - bounds.height)
            rectY = this.viewport.worldHeight - bounds.height;
        this.zoomRectangle.position.set(rectX, rectY);
    }

    initalBounds(bounds) {
        let x1 = ~~(bounds.x / this.stitchSize);
        let x2 = x1 + ~~(bounds.width / this.stitchSize) + 2;
        let y1 = ~~(bounds.y / this.stitchSize);
        let y2 = y1 + ~~(bounds.height / this.stitchSize) + 2;
        if (x1 < 0)
            x1 = 0;
        if (y1 < 0)
            y1 = 0;
        if (x2 > this.stitches[0].length)
            x2 = this.stitches[0].length;
        if (y2 > this.stitches.length)
            y2 = this.stitches.length;
        return { x1, x2, y1, y2 };
    }

    initialCull(bounds) {
        let x1 = ~~(bounds.x / this.stitchSize);
        let x2 = ~~((bounds.x + bounds.width) / this.stitchSize);
        let y1 = ~~(bounds.y / this.stitchSize);
        let y2 = ~~((bounds.y + bounds.height) / this.stitchSize);
        if (x1 < 0)
            x1 = 0;
        if (y1 < 0)
            y1 = 0;
        if (x2 > this.stitches[0].length - 1)
            x2 = this.stitches[0].length - 1;
        if (y2 > this.stitches.length - 1)
            y2 = this.stitches.length - 1;
        for (let x = x1; x <= x2; x++)
            for (let y = y1; y <= y2; y++)
                this.sprites[y][x].visible = true;
    }

    enablePan(enable) {
        if (enable)
            this.viewport.drag({
                mouseButtons: 'right-left',
            });
        else
            this.viewport.drag({
                mouseButtons: 'right',
            });
    }

    openMiniature(open) {
        if (open)
            this.miniature.renderable = true;
        else
            this.miniature.renderable = false;
    }

    clearZoomRectangle() {
        this.zoomRectangle.renderable = false;
    }

    setMiniaturePos(position) {
        this.miniaturePos = position;
        switch (position) {
            case 'top-left':
                this.miniature.position.set(0, 0);
                break;
            case 'top-right':
                this.miniature.position.set(this.app.view.width - this.miniature.width, 0);
                break;
            case 'bottom-left':
                this.miniature.position.set(0, this.app.view.height - this.miniature.height);
                break;
            case 'bottom-right':
                this.miniature.position.set(this.app.view.width - this.miniature.width, this.app.view.height - this.miniature.height);
                break;
            default:
                this.miniature.position.set(0, 0);
                break;
        }
    }

    handleResize(e) {
        let wrapper = document.getElementById('canvas-wrapper');
        this.app.renderer.resize(wrapper.clientWidth, wrapper.clientHeight);
        this.app.view.width = wrapper.clientWidth;
        this.app.view.height = wrapper.clientHeight;
        this.viewport.resize(wrapper.clientWidth, wrapper.clientHeight);
        let minScale = this.viewport.findFit(this.viewport.worldWidth, this.viewport.worldHeight);
        this.viewport.clampZoom({
            minScale: minScale,
            maxScale: 1
        });
        this.scale = this.viewport.lastViewport.scaleX;
        let width = ((this.viewport.screenWidth / this.viewport.worldWidth) * this.stitches[0].length) / this.scale;
        let height = ((this.viewport.screenHeight / this.viewport.worldHeight) * this.stitches.length) / this.scale;
        this.miniatureRect.clear();
        this.miniatureRect.lineStyle(2);
        this.miniatureRect.drawRect(0, 0, width, height);
        this.miniatureRect.position.set(
            (-this.viewport.lastViewport.x / this.scale / this.viewport.worldWidth) * this.miniature.width,
            (-this.viewport.lastViewport.y / this.scale / this.viewport.worldHeight) * this.miniature.height
        );
        this.setMiniaturePos(this.miniaturePos);
    }

    on(eventType, handler) {
        
        this.viewport.on(eventType, e => {
            if (e.data)
                e.pos = {
                    x: e.data.global.x / this.viewport.scale.x + this.viewport.hitArea.x,
                    y: e.data.global.y / this.viewport.scale.x + this.viewport.hitArea.y
                }
            handler(e);
        });
    }

    dispose() {
        for (let i = 0; i < this.stitchedTextures.length; i++) {
            this.stitchedTextures[i].destroy();
            this.stitchedTextures[i] = null;
        }
        for (let y = 0; y < this.sprites.length; y++)
            for (let x = 0; x < this.sprites[0].length; x++) {
                this.sprites[y][x].destroy();
                this.sprites[y][x] = null;
            }
        for (let i = 0; i < this.linesX.length; i++) {
            this.linesX[i].destroy(true);
            this.linesX[i] = null;
        }
        for (let i = 0; i < this.linesY.length; i++) {
            this.linesY[i].destroy(true);
            this.linesY[i] = null;
        }
        this.spritesheet.destroy(true);
        this.miniatureRect.destroy();
        this.miniatureRect = null;
        this.miniature.destroy();
        this.miniature = null;
        this.selectionRect.destroy();
        this.selectionRect = null;
        for (let key in PIXI.utils.TextureCache) {
            PIXI.utils.TextureCache[key].destroy(true);
        }
        this.viewport.destroy();
        this.app.renderer.gl.getExtension('WEBGL_lose_context').loseContext();
        this.app.destroy();
        window.removeEventListener('resize', this.handleResize);
    }

}