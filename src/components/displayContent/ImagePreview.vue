<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div class="canvas-container">
    <div class="canvas-wrapper">
      <button @click.prevent="addNewBox">Add Text Area</button>
      <label for="fileInput" class="upload-button">Upload Image</label>

      <div class="canvas-border">
        <input
          type="file"
          id="fileInput"
          @change="handleImageUpload"
          accept="image/*"
          style="display: none"
        />
        <canvas
          class="image_canvas"
          :id="canvasid"
          ref="canvasRef"
          :width="canvasWidth + 'px'"
          :height="canvasHeight + 'px'"
        ></canvas>
        <div
          v-for="(box, index) in boxes"
          :key="index"
          class="draggable-box"
          :style="{
            top: box.yPos + 'px',
            left: box.xPos + 'px',
            width: box.width + 'px',
            height: box.height + 'px',
            border: box.border ? '2px solid #000' : 'none', // Conditional border style
          }"
          @mousedown="startDrag(index, $event)"
        >
          <div class="content-container">
            <div class="image-container" v-if="box.image">
              <img
                :src="box.image"
                alt="Uploaded Image"
                class="resizable-image"
                :style="{ width: box.width + 'px', height: box.height + 'px' }"
              />
              <div
                v-if="!isResizing || (isResizing && resizeType === 'image')"
                class="resize-handle"
                @mousedown="startResize(index, $event, 'image')"
              ></div>
            </div>
            <textarea
              v-model="box.customText"
              @input="updateBoxDimensions(index)"
              class="resizable-textarea"
              :style="{
                width: box.width + 'px',
                height: box.height + 'px',
                xPos: box.xPos + 'px',
                yPos: box.yPos + 'px',
                fontStyle: box.italic ? 'italic' : 'normal',
                fontWeight: box.bold ? 'bold' : 'normal',
                fontSize: box.fontSize + 'px', // Add this line for fontSize
                border: box.border ? '2px solid #000' : 'dashed',
              }"
              style="overflow: hidden"
            ></textarea>

            <div
              v-if="!isResizing || (isResizing && resizeType === 'text')"
              class="resize-handle"
              @mousedown="startResize(index, $event, 'text')"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    textBoxData: Array,
    resolutionUuid: String,
    room: Number,
    header: Boolean,
    footer: Boolean,
    multipleRoom: Boolean,
    selectedTemplateId: Number,
  },
  data() {
    return {
      canvasWidth: 1000,
      canvasHeight: 1000,
      canvasBorderWidth: 0,
      canvasBorderHeight: 0,
      boxes: this.textBoxData,
      isDragging: false,
      isResizing: false,
      resizeType: "",
      currentBoxIndex: null,
      startX: 0,
      startY: 0,
      originalWidth: 0,
      originalHeight: 0,
      lineHeight: 0,
      canvasid: "yourCanvasId",
      roomData: [],
      indexes: [],
      previewImageUrl: "",
      indexUp: 0,
    };
  },
  mounted() {
    const scaledWidth = this.canvasWidth;
    const scaledHeight = this.canvasHeight;
    const canvas = this.$refs.canvasRef;
    canvas.width = scaledWidth;
    this.$set(this.roomData, 0, this.room);
    canvas.height = scaledHeight;
    this.getResolution();
    this.updateCanvasBorderSize();
  },
  watch: {
    textBoxData: {
      handler(newTextBoxData, oldTextBoxData) {
        if (JSON.stringify(newTextBoxData) !== JSON.stringify(oldTextBoxData)) {
          this.updateTextAreas(newTextBoxData);
        }
      },
      deep: true,
    },

    room: {
      handler() {
        this.updateCanvasBorderSize();
      },
      deep: true,
    },
    multipleRoom: {
      handler() {
        this.updateCanvasBorderSize();
      },
      deep: true,
    },
    header: {
      handler() {
        this.updateCanvasBorderSize();
      },
      deep: true,
    },
    footer: {
      handler() {
        this.updateCanvasBorderSize();
      },
      deep: true,
    },
    selectedTemplateId: {
      handler() {
        let template = this.$store.state.templates.find(
          (t) => t.uuid === this.selectedTemplateId,
        );

        if (
          template &&
          template.displayContent &&
          template.displayContent.imageFields
        ) {
          template.displayContent.imageFields.forEach((field) => {
            this.boxes.push(field);
          });
        }
        this.$emit("updateTextBoxData", this.boxes);
        this.$emit("boxes", this.boxes);
        this.$emit("textBoxData", this.boxes);
        this.printTextBoxData();
      },
      deep: true,
    },
    indexUp(newValue) {
      this.$emit("updateIndexUp", newValue);
    },
    resolutionUuid: {
      handler() {
        this.updateCanvasBorderSize();
      },
      deep: true,
    },
  },
  methods: {
    updateIndexUp(newValue) {
      this.indexUp = newValue;
    },
    saveCanvas() {
      const canvas = this.$refs.canvasRef;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.boxes.forEach((box) => {
        if (box.customText === "img") {
          const image = new Image();
          image.src = box.image; 
          ctx.drawImage(image, box.xPos, box.yPos, box.width, box.height);
          if (box.border) {
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.strokeRect(box.xPos, box.yPos, box.width, box.height);
          }
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(box.xPos, box.yPos, box.width, box.height);
          ctx.fillStyle = "#000000";
          ctx.font = `${box.italic ? "italic" : ""} ${box.bold ? "bold" : ""} ${box.fontSize}px sans-serif`;
          const lines = box.customText.split("\n");
          let offsetY = 0;
          lines.forEach((line) => {
            ctx.fillText(line, box.xPos, box.yPos + offsetY + box.fontSize);
            offsetY += box.fontSize * 1.2; 
          });
          if (box.border) {
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.strokeRect(box.xPos, box.yPos, box.width, box.height);
          }
        }
      });
      const dataURL = canvas.toDataURL();
      return dataURL;
    },
    handleImageUpload(event) {
      const input = event.target;
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const image = new Image();
          image.onload = () => {
            const newBox = {
              xPos: 50,
              yPos: 50,
              width: image.width,
              height: image.height,
              customText: "img",
              fieldType: "EVENT_DESCRIPTION",
              fontSize: 0,
              bold: false,
              italic: false,
              image: e.target.result,
              showDeleteButton: true,
              border: false,
              repeat: false,
              isRepeated: false,
              created: new Date(),
              lastUpdate: new Date(),
            };
            this.boxes.push(newBox);

            this.printTextBoxData();
          };

          image.src = e.target.result;
        };

        reader.readAsDataURL(file);
      }

      input.value = "";
    },

    addNewBox() {
      const newBox = {
        xPos: 50,
        yPos: 50,
        width: 150,
        height: 100,
        customText: "Type here...",
        fieldType: "EVENT_DESCRIPTION",
        fontSize: 22,
        bold: false,
        italic: false,
        image: null,
        showDeleteButton: true,
        border: false,
        repeat: false,
        isRepeated: false,
        created: new Date(),
        lastUpdate: new Date(),
      };
      this.boxes.push(newBox);
      this.printTextBoxData();
    },
    getResolution() {
      const resolution = this.$store.state.resolutions.find(
        (r) => r.uuid === this.resolutionUuid,
      );
      const canvas = this.$refs.canvasRef;
      if (canvas && resolution) {
        canvas.width = resolution.width;
        canvas.height = resolution.height;
        this.canvasWidth = resolution.width;
        this.canvasHeight = resolution.height;
      }
    },
    updateTextAreas(textBoxData) {
      textBoxData.forEach((data, index) => {
        if (this.boxes[index]) {
          this.boxes[index].customText = data.customText;
          this.boxes[index].width = data.width;
          this.boxes[index].xPos = data.xPos;
          this.boxes[index].yPos = data.yPos;
          this.boxes[index].height = data.height;
          this.boxes[index].italic = data.italic;
          this.boxes[index].bold = data.bold;
          this.boxes[index].fontSize = data.fontSize;
          this.boxes[index].fieldType = data.fieldType;
          this.boxes[index].image = data.image;
          this.boxes[index].border = data.border;
          this.boxes[index].repeat = data.repeat;
          this.boxes[index].isRepeated = data.isRepeated;

          this.boxes[index].created = data.created;
          this.boxes[index].lastUpdate = new Date();
          if (this.indexes.includes(index) && data.repeat == false) {
            this.indexes.splice(index, 1);
          } else if (
            !this.indexes.includes(index) &&
            this.boxes[index].repeat == true &&
            this.boxes[index].isRepeated == false
          ) {
            this.indexes.push(index);
            this.boxes[index].isRepeated = true;
            let varY = data.yPos + this.roomData[2];
            for (let i = 0; i < this.roomData[0] - 1; i++) {
              const newBox = {
                ...data,
                field: data.field,
                yPos: varY,
                repeat: false,
                isRepeated: true,
              };
              varY += this.roomData[2];
              this.boxes.push(newBox);
            }
            this.printTextBoxData();
          }
        }

        this.$emit("updateTextBoxData", this.boxes);
        this.$emit("boxes", this.boxes);
        this.$emit("textBoxData", this.boxes);
      });

      // this.boxes = textBoxData;
    },
    updateBoxDimensions(index) {
      const box = this.boxes[index];
      const textarea = this.$refs[`textarea_${index}`];
      if (textarea) {
        box.customText = textarea.value;
        box.width = textarea.scrollWidth;
        box.height = textarea.scrollHeight;
      }
      this.printTextBoxData();
    },
    updateCanvasBorderSize() {
      this.getResolution();
      const canvas = this.$refs.canvasRef;
      const ctx = canvas.getContext("2d");
      const numLines = 5;
      let lineHeight = canvas.height / (numLines + 1);
      this.boxes = this.boxes.filter(
        (box) => box.yPos + box.height <= canvas.height,
      );
      let marginTop = 0;
      let marginBottom = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "red";
      ctx.setLineDash([5, 5]);
      this.roomData[1] = 0;
      this.$set(this.roomData, 1, 0);
      if (this.header) {
        marginTop = 100;
        ctx.beginPath();
        ctx.moveTo(0, marginTop);
        ctx.lineTo(canvas.width, marginTop);
        ctx.stroke();
        this.roomData[1] = 100;
        this.$set(this.roomData, 1, 100);
      }

      if (this.footer) {
        marginBottom = 100;
        const redLineYBottom = canvas.height - marginBottom;
        ctx.beginPath();
        ctx.moveTo(0, redLineYBottom);
        ctx.lineTo(canvas.width, redLineYBottom);
        ctx.stroke();
      }

      if (this.header && this.footer) {
        lineHeight =
          (canvas.height - marginBottom - marginTop) / (numLines + 1);
        this.roomData[2] = lineHeight;
        this.$set(this.roomData, 2, lineHeight);
      } else if (this.header) {
        lineHeight = (canvas.height - marginTop) / (numLines + 1);
        this.roomData[2] = lineHeight;
        this.$set(this.roomData, 2, lineHeight);
      } else if (this.footer) {
        lineHeight = (canvas.height - marginBottom) / (numLines + 1);
        this.roomData[2] = lineHeight;
        this.$set(this.roomData, 2, lineHeight);
      } else {
        lineHeight = canvas.height / (numLines + 1);
        this.roomData[2] = lineHeight;
        this.$set(this.roomData, 2, lineHeight);
      }
      if (canvas.height == 5120 && canvas.width == 1440) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.lineCap = "butt";
      }
      this.$emit("updateRoomData", this.roomData);

      if (this.multipleRoom) {
        ctx.strokeStyle = "gray";
        ctx.setLineDash([5, 5]);
        for (let i = 1; i <= numLines; i++) {
          const y = i * lineHeight + marginTop;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }
    },

    printTextBoxData() {
      const textBoxData = this.boxes.map((box) => ({
        xPos: box.xPos,
        yPos: box.yPos,
        width: box.width,
        height: box.height,
        customText: box.customText,
        fieldType: box.fieldType,
        fontSize: box.fontSize,
        bold: box.bold,
        italic: box.italic,
        image: box.image,
        border: box.border,
        repeat: box.repeat,
        isRepeated: box.isRepeated,
        created: box.created,
        lastUpdate: box.lastUpdate,
      }));
      this.$emit("updateTextBoxData", textBoxData);
      this.$emit("textBoxData", textBoxData);
      this.$emit("boxes", this.textBoxData);
    },

    startDrag(index, event) {
      this.indexUp = index;
      if (!this.boxes[index].isRepeated) {
        this.isDragging = true;

        this.currentBoxIndex = index;
        this.startX = event.clientX - this.boxes[index].xPos;
        this.startY = event.clientY - this.boxes[index].yPos;
        document.addEventListener("mousemove", this.handleDrag);
        document.addEventListener("mouseup", this.stopDrag);
      }
    },

    handleDrag(event) {
      if (this.isDragging) {
        const box = this.boxes[this.currentBoxIndex];
        const canvas = this.$refs.canvasRef;
        const canvasRect = canvas.getBoundingClientRect();

        const newX = event.clientX - this.startX;
        const newY = event.clientY - this.startY;

        box.xPos = Math.max(0, Math.min(newX, canvasRect.width - box.width));
        box.yPos = Math.max(0, Math.min(newY, canvasRect.height - box.height));

        this.$nextTick(() => {
          this.updateBoxDimensions(this.currentBoxIndex);
        });
      }
    },

    startResize(index, event, type) {
      this.indexUp = index;
      if (!this.boxes[index].isRepeated) {
        this.isResizing = true;
        this.currentBoxIndex = index;
        this.startX = event.clientX;
        this.startY = event.clientY;
        this.originalWidth = this.boxes[index].width;
        this.originalHeight = this.boxes[index].height;
        this.resizeType = type;

        document.addEventListener("mousemove", this.handleResize);
        document.addEventListener("mouseup", this.stopResize);
      }
    },

    handleResize(event) {
      if (this.isResizing) {
        this.indexUp = this.currentBoxIndex;
        const box = this.boxes[this.currentBoxIndex];
        const originalWidth = box.width;
        const originalHeight = box.height;

        const deltaX = event.clientX - this.startX;
        const deltaY = event.clientY - this.startY;

        if (this.resizeType === "image" && box.image) {
          box.width = Math.max(10, originalWidth + deltaX);
          box.height = (box.width / originalWidth) * originalHeight;
        } else if (this.resizeType === "text") {
          box.width = Math.max(10, originalWidth + deltaX);
          box.height = Math.max(10, originalHeight + deltaY);

          this.$nextTick(() => {
            this.updateBoxDimensions(this.currentBoxIndex);
          });
        }

        this.startX = event.clientX;
        this.startY = event.clientY;
      }
    },

    stopResize() {
      this.isResizing = false;
      this.currentBoxIndex = null;
      this.resizeType = "";
      document.removeEventListener("mousemove", this.handleResize);
      document.removeEventListener("mouseup", this.stopResize);
    },

    stopDrag() {
      this.isDragging = false;
      this.currentBoxIndex = null;
      document.removeEventListener("mousemove", this.handleDrag);
      document.removeEventListener("mouseup", this.stopDrag);
    },

    showDeleteButton(index) {
      this.boxes.forEach((box, i) => {
        this.$set(box, "showDeleteButton", i === index);
      });
    },

    deleteBox(index) {
      this.boxes.splice(index, 1);
      this.printTextBoxData();
    },
  },
};
</script>
<style scoped>
button {
  margin-top: 10px;
}

.draggable-box {
  position: absolute;
  border: none; /* Remove border or set it to transparent */
  background-color: rgba(0, 0, 0, 0);
  cursor: move;
  overflow: hidden;
}

.resize-handle {
  position: absolute;
  width: 5px;
  height: 5px;
  background-color: #333;
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
}

.resizable-textarea,
.resizable-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: transparent;
  border: 0px dashed #000;
}

.resizable-textarea {
  width: 100%;
  height: 100%;
  border: 1px dashed #000;
  white-space: pre-wrap;
  /* Set the border to dashed style */
}

textarea {
  width: 100%;
  height: 100%;
  resize: none;
}

.content-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.horizontal-line {
  position: absolute;
  width: 100%; /* Adjust the width as needed */
  height: 2px; /* Adjust the height as needed */
  background-color: gray;
}

.delete-button {
  position: absolute;
  top: -5px;
  right: -5px;
  cursor: pointer;
  background-color: black;
  color: white;
  padding: 3px;
  border-radius: 1px;
  z-index: 2;
}

.box-id {
  position: absolute;
  top: -5px;
  right: 13px;
  cursor: pointer;
  background-color: black;
  color: white;
  padding: 3px;
  border-radius: 1px;
  z-index: 2;
}

.canvas-border {
  position: relative;
  border: 2px solid #000;
  overflow: hidden;
  margin: 0px;
}

.canvas-wrapper {
  width: 100%; /* Set to the desired width */
  height: 100%; /* Set to the desired height */
  overflow: hidden; /* Prevent content from overflowing */
}
.image_canvas {
  display: block;
  margin: auto; /* Center the canvas horizontally and vertically */
}
.canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%; /* Set to the desired height */
}

.upload-button {
  cursor: pointer;
  display: inline-block;
  background-color: #eeeeee;
  color: black;
  margin-top: 10px;
  margin-left: 10px;
  border: 1px solid #cccccc; /* Add border */
}
.upload-button:hover {
  background-color: #dddddd; /* Change background color on hover */
}

input[type="file"] {
  display: none;
}
</style>
