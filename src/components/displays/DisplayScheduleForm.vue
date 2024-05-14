<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <b-form @submit.prevent="submitSchedule">
    <div class="editor">
      <b-card :title="pageTitle" class="form_card">
        <b-card-text>
          <div class="row">
            <!-- Description input field -->
            <div class="col-md-6">
              <b-form-input
                v-model="eventDescription"
                label="Description"
                placeholder="Enter a description"
                class="mb-3"
              />
            </div>
            <!-- Override label and checkbox -->
            <div class="col-md-2 d-flex align-items-center justify-content-end">
              <label class="mb-0 s">
                <input type="checkbox" v-model="override" /> Override
              </label>
            </div>
            <div class="col-md-3 d-flex align-items-center justify-content-end">
              <label class="mb-0 s">
                <input type="checkbox" v-model="include" /> Include to multiple
                Screen
              </label>
            </div>
          </div>
          <b-form-group label="From date and time:" class="form_group">
            <div class="d-flex h-auto">
              <b-form-datepicker
                v-model="startDate"
                :value-as-date="true"
              ></b-form-datepicker>
              <b-form-input v-model="startTime" type="time" />
            </div>
          </b-form-group>
          <b-form-group label="To date and time:" class="form_group">
            <div class="d-flex h-auto">
              <b-form-datepicker
                v-model="endDate"
                :value-as-date="true"
              ></b-form-datepicker>
              <b-form-input v-model="endTime" placeholder="HH" type="time" />
            </div>
          </b-form-group>
        </b-card-text>
        <b-form-group
          v-if="!shouldShowTemplateSection"
          label="Choose a template:"
          class="form_group"
          description="Choosing a different template will override existing picture and fields"
        >
          <b-form-select
            v-model="selectedTemplateId"
            value-field="uuid"
            text-field="name"
            :options="templates"
            @input="onSelectedTemplateChange"
          >
          </b-form-select>
        </b-form-group>

        <b-form-group
          v-else
          label="Choose a room"
          class="form_group"
          description="Choosing one of the rooms of the display"
          required
        >
          <b-form-select
            v-model="selectedRoom"
            value-field="code"
            text-field="name"
            :options="roomCodes"
            @change="roomSelected"
            required
          >
          </b-form-select>
        </b-form-group>

        <b-card v-if="roomCodes && roomCodes.length > 1">
          <b-card-text>
            <div>
              <ImageFieldTemplate1
                :textBoxData="textBoxData"
                @updateTextBoxData="handleTextBoxData"
                :roomTextBoxData="roomTextBoxData"
                @handleRoomData="handleRoomData"
                :indexUp="indexUp"
                ref="displayDataTemplate"
                :selectedRoomIndex="selectedRoomIndex"
                :templateId="selectedTemplateId"
              />
            </div>
          </b-card-text>
        </b-card>
        <b-card v-else>
          <b-card-text>
            <div>
              <ImageFieldTemplate2
                :textBoxData="textBoxData"
                @updateTextBoxData="handleTextBoxData"
                :indexUp="indexUp"
                ref="displayDataTemplate"
              />
            </div>
          </b-card-text>
        </b-card>
      </b-card>
      <b-card v-if="roomCodes && roomCodes.length > 1" class="imagePrevieww">
        Display preview
        <ImagePreview1
          @updateTextBoxData="handleTextBoxData"
          :resolutionUuid="resolutionUuid"
          :textBoxData="textBoxData"
          :indexUp="indexUp"
          @updateIndexUp="updateIndexUp"
          :roomData="roomData"
          :selectedRoomIndex="selectedRoomIndex"
          :templateId="selectedTemplateId"
          ref="imagePreview1"
        />
      </b-card>
      <b-card v-else class="imagePrevieww">
        Display preview
        <ImagePreview
          @updateTextBoxData="handleTextBoxData"
          :resolutionUuid="resolutionUuid"
          :textBoxData="textBoxData"
          :indexUp="indexUp"
          @updateIndexUp="updateIndexUp"
          :selectedTemplateId="selectedTemplateId"
          :roomData="roomData"
          ref="imagePrevieww"
        />
      </b-card>
    </div>
    <div class="mb-3 mt-2">
      <b-button variant="danger" class="mr-2" @click="$emit('completed')">
        Cancel
      </b-button>
      <b-button variant="success" type="submit"> Save </b-button>
    </div>
  </b-form>
</template>

<script>
import toastPresets from "@/utils/toastPresets.js";
import ImagePreview from "@/components/displayContent/ImagePreview.vue";
import ImageFieldTemplate2 from "@/components/displayContent/ImageFieldTemplate2.vue";
import ImagePreview1 from "@/components/displayContent/ImagePreview1.vue";
import ImageFieldTemplate1 from "@/components/displayContent/ImageFieldTemplate1.vue";

export default {
  props: {
    editMode: Boolean,

    initialDescription: {
      type: String,
      default: "",
    },
    initialStartDate: {
      type: Date,
      default: () => new Date(),
    },
    initialEndDate: {
      type: Date,
      default: () => new Date(),
    },

    eventId: Number,
    displayUuid: String,
    uuid: String,
    initialImageFields: Array,
    initialOverride: Boolean,
    initialInclude: Boolean,
    initialTemplate: String,
    initialRoom: String,
  },
  components: {
    ImagePreview,
    ImageFieldTemplate2,
    ImagePreview1,
    ImageFieldTemplate1,
  },
  watch: {
    textBoxData: {
      deep: true,
      handler(val) {
        this.handleTextBoxData(val);
      },
    },
    roomTextBoxData: {
      deep: true,
      handler() {},
    },
    imageFields: {
      deep: true,
      handler() {
        //this.refreshImagePreview();
      },
    },
    indexUp: {
      deep: true,
      handler() {},
    },
    selectedTemplateId: {
      handler(value) {
        this.selectedTemplateId = value;
      },
      deep: true,
    },
  },
  mounted() {
    let display = this.$store.state.displays.find(
      (d) => d.uuid === this.displayUuid,
    );
    // Perform null check before accessing nested properties
    if (display && display.template) {
      let template = this.$store.state.templates.find(
        (t) => t.uuid === display.template.uuid,
      );
      if (template) {
        this.selectedTemplateId = template.uuid;
        // this.onSelectedRoomChange(template);
        this.onSelectedTemplateChange(template.uuid);
        if (template) {
          this.header = template.header;
          this.footer = template.footer;
          this.roomData = template.roomData;
        }
      }
    }
  },

  data() {
    return {
      startDate: new Date(this.initialStartDate.getTime()),
      startTime: this.initialStartDate.toTimeString().substring(0, 5),
      endDate: new Date(this.initialEndDate.getTime()),
      endTime: this.initialEndDate.toTimeString().substring(0, 5),
      eventDescription: this.initialDescription,
      selectedTemplateId: this.initialTemplate,
      templateId: this.initialTemplate,
      override: this.initialOverride || false,
      include: this.initialInclude || false,
      image: null,
      imageFields: this.initialImageFields || [],
      textBoxData: this.initialImageFields || [],
      selectedRoom: this.initialRoom,
      selectedRoomIndex: null,
      roomTextBoxData: [],
      indexUp: null,
      roomData: [],
    };
  },
  computed: {
    resolutionUuid() {
      let display = this.$store.state.displays.find(
        (d) => d.uuid === this.displayUuid,
      );
      let resolution = this.$store.state.resolutions.find(
        (r) => r.uuid === display.resolution.uuid,
      );

      return resolution ? resolution.uuid : null;
    },
    roomCodes() {
      let display = this.$store.state.displays.find(
        (d) => d.uuid === this.displayUuid,
      );
      return display
        ? display.roomCodes
            .map(
              (code) =>
                this.$store.state.rooms.find((r) => r.code === code)?.name,
            )
            .filter(Boolean)
        : [];
    },
    multiTemplate() {
      let display = this.$store.state.displays.find(
        (d) => d.uuid === this.displayUuid,
      );
      return this.onSelectedTemplateChange(display.template);
    },
    shouldShowTemplateSection() {
      let display = this.$store.state.displays.find(
        (d) => d.uuid === this.displayUuid,
      );
      return display && display.roomCodes.length > 1;
    },
    pageTitle() {
      return this.editMode ? "Edit scheduled content" : "Add scheduled content";
    },

    templates() {
      return this.$store.state.templates.filter(
        (template) => !template.multipleRoom,
      );
    },
  },
  methods: {
    passFunction() {
      let display = this.$store.state.displays.find(
        (d) => d.uuid === this.displayUuid,
      );
      return display.roomCodes.length == 1;
    },
    checkForDuplicates() {
      // If there are no "OTHER" fields, filter for duplicates
      //if (otherFields.length === 0) {
      const filteredTextBoxData = this.textBoxData.filter(
        (imageField) =>
          !(imageField.repeat && imageField.isRepeated) ||
          !(!imageField.repeat && !imageField.isRepeated),
      );

      const duplicates = filteredTextBoxData.filter((imageField) => {
        return (
          filteredTextBoxData.filter(
            (f) =>
              f.fieldType !== "OTHER" && f.fieldType === imageField.fieldType,
          ).length > 1
        );
      });
      return duplicates.length === 0;
    },
    handleTextBoxData(data) {
      this.textBoxData = data;
    },
    updateRoomTextBoxData() {
     
    },
    handleRoomData(data) {
      this.roomTextBoxData = data;
    },
    updateIndexUp(newValue) {
      this.indexUp = newValue;
    },
    roomSelected() {
      const selectedRoomIndex = this.roomCodes.findIndex(
        (room) => room === this.selectedRoom,
      );
      this.selectedRoomIndex =
        selectedRoomIndex !== -1 ? selectedRoomIndex + 1 : null;
    },

    refreshImagePreview() {
      this.$refs.imagePreview1.refreshImageCanvas();
      this.$refs.imagePrevieww.refreshImageCanvas();
    },
    submitSchedule() {
      if (this.checkForDuplicates()) {
        const {
          startDate,
          endDate,
          eventDescription,
          eventId,
          displayUuid,
          uuid,
          override,
          include,
          textBoxData,
          //selectedRoomIndex,
        } = this;
        let display = this.$store.state.displays.find(
                (d) => d.uuid === this.displayUuid,
              );
              if (display.roomCodes.length > 1) {
                // Perform null check before accessing nested properties
                let template = this.$store.state.templates.find(
                  (t) => t.uuid === display.template.uuid,
                );
                if (template && template.multipleRoom) {
                  const start = template.roomData[1];
                  const end = start + template.roomData[2];
                  this.textBoxData = this.textBoxData.filter(
                    (box) => box.yPos >= start && box.yPos < end,
                  );
                  this.$emit("textBoxData", this.textBoxData);
                }
              }
        let content = {
          scheduledContentUuid: uuid,
          displayContent: {
            imageFields: this.textBoxData, //roomdata
            // imageBase64: this.$refs.imagePrevieww.saveCanvas(),
          },
        };

        if (this.selectedRoomIndex) {
          content.displayContent.imageBase64 =
            this.$refs.imagePreview1.saveCanvas(textBoxData);
        } else {
          content.displayContent.imageBase64 =
            this.$refs.imagePrevieww.saveCanvas();
        }
        let roomCodef = this.$store.state.rooms.find(
          (r) => r.name === this.selectedRoom,
        );

        const data = {
          startDate,
          endDate,
          eventDescription,
          eventId,
          displayUuid,
          uuid,
          override,
          include,
        };
        if (roomCodef != null) {
          data.room = roomCodef.code;
        } else {
          let display = this.$store.state.displays.find(
            (d) => d.uuid === this.displayUuid,
          );
          data.room = display.roomCodes[0];
        }

        data.startDate.setHours(parseInt(this.startTime.substring(0, 2)));
        data.startDate.setMinutes(parseInt(this.startTime.substring(3, 5)));

        data.endDate.setHours(parseInt(this.endTime.substring(0, 2)));
        data.endDate.setMinutes(parseInt(this.endTime.substring(3, 5)));
        let storeOperation;
        if (this.editMode) {
          storeOperation = "updateDisplaySchedule";
          data.uuid = uuid;
        } else {
          storeOperation = "createDisplaySchedule";
        }
        this.$store
          .dispatch(storeOperation, data)
          .then((data) => {
            if (data) {
              content.scheduledContentUuid = data.uuid;
            }
            return this.$store.dispatch("updateScheduledContent", content);
          })
          .then(() => this.$emit("completed"))
          .then(() => this.$router.replace("displays"))
          .catch(() => {
            this.$bvToast.toast(
              "Failed to save scheduled content",
              toastPresets.errorMessage,
            );
          });
      } else {
        this.$bvToast.toast(
          "Duplicate text field found",
          toastPresets.errorMessage,
        );
        return;
      }
    },
    onSelectedTemplateChange(value) {
      let template = this.$store.state.templates.find((t) => t.uuid === value);
      //this.$emit("selectedTemplateId", value)
      let newData = [];
      if (template && template.displayContent && template.displayContent.imageFields ) {
        // First, filter the image fields of the template where !isRepeated

        const filteredTemplateFields = template.displayContent.imageFields.filter(
          (f) =>
            (f.yPos >= template.roomData[1] &&
            f.yPos <= template.roomData[1] + template.roomData[2]) && f.isRepeated,
        );
        
        const newFields= filteredTemplateFields.filter(field =>
        // Filter out elements where x, y, width, or height are not equal
        !this.textBoxData.some(textBox =>
            textBox.xPos === field.xPos &&
            textBox.yPos === field.yPos &&
            textBox.width === field.width &&
            textBox.height === field.height
        )
    );
    // Push elements from `this.textBoxData` and filtered `template.displayContent.imageFields` to `newData`
    newData.push(
        ...this.textBoxData,
        ...newFields
    );

        this.handleTextBoxData(newData);
        this.textBoxData = newData;
        this.$emit("updateTextBoxData", newData);
        this.$emit("textBoxData", newData);
      }
    },
    onSelectedRoomChange(template) {
      if (template) {
        let newData = [];
        newData.push(...this.textBoxData);
        
        if (template.displayContent && template.displayContent.imageFields) {
                 template.displayContent.imageFields.forEach((field) => {
            let exists = this.textBoxData.some((textBox) => {
              return (
                textBox.xPos === field.xPos &&
                textBox.yPos === field.yPos &&
                textBox.width === field.width &&
                textBox.height === field.height
              );
            });

            if (!exists) {
              newData.push({ ...field });
            }
          });
        }
        this.textBoxData = newData;
        this.$emit("updateTextBoxData", this.textBoxData);
      }
    },
  },
};
</script>

<style scoped>
.editor {
  overflow: auto;
}
.form_card {
  width: 50%;
  float: left;
  margin-bottom: 5px;
}
.left-content {
  flex: 0 0 70%;
  padding-right: 10px; /* Add some spacing between the left and right content */
}
.right-content {
  flex: 0 0 30%;
}
.form_group {
  text-align: left;
}
.editor {
  overflow: auto;
}
.imagePrevieww {
  width: 50%;
}
.input-row {
  display: flex;
  align-items: center;
}

/* Responsive layout - makes a one column-layout instead of two-column layout */
@media (max-width: 1200px) {
  .form_card {
    width: 100%;
  }
  .imagePrevieww {
    width: 100%;
  }
}
</style>
