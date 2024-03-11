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
            <div class="col-md-9">
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
              <DisplayDataTemplate1
                :textBoxData="textBoxData"
                @updateTextBoxData="handleTexBoxData"
                :roomTextBoxData="roomTextBoxData"
                @handleRoomData="handleRoomData"
                :indexUp="indexUp"
                ref="displayDataTemplate"
                :room="numRooms"
                :selectedRoomIndex="selectedRoomIndex"
                :templateId="selectedTemplateId"
              />
            </div>
          </b-card-text>
        </b-card>
        <b-card v-else>
          <b-card-text>
            <div>
              <DisplayDataTemplate
                :textBoxData="textBoxData"
                @updateTextBoxData="handleTexBoxData"
                :indexUp="indexUp"
                ref="displayDataTemplate"
                :room="numRooms"
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
          :room="numRooms"
          :header="header"
          :footer="footer"
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
          :room="numRooms"
          :header="header"
          :footer="footer"
          :indexUp="indexUp"
          @updateIndexUp="updateIndexUp"
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
import DisplayDataTemplate from "@/components/displayContent/DisplayDataTemplate.vue";
import ImagePreview1 from "@/components/displayContent/ImagePreview1.vue";
import DisplayDataTemplate1 from "@/components/displayContent/DisplayDataTemplate1.vue";

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
    initialTemplate: Object,
  },
  components: {
    ImagePreview,
    DisplayDataTemplate,
    ImagePreview1,
    DisplayDataTemplate1,
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
      handler(val) {
        this.roomTextBoxData(val);
      },
    },
    imageFields: {
      deep: true,
      handler() {
        this.refreshImagePreview();
      },
    },
    indexUp(newValue) {
      this.$refs.displayDataTemplate.updateIndexUp(newValue);
    },
  },
  mounted() {
    let display = this.$store.state.displays.find(
      (d) => d.uuid === this.displayUuid,
    );
    let template = this.$store.state.templates.find(
      (t) => t.uuid === display.template.uuid,
    );
    if (template) {
      this.selectedTemplateId = template.uuid;
      this.onSelectedRoomChange();
      if (template) {
        this.header = template.header;
        this.footer = template.footer;
        this.roomData = template.roomData;
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
      override: this.initialOverride || false,
      image: null,
      imageFields: this.initialImageFields || [],
      textBoxData: this.initialImageFields || [],
      selectedRoom: null,
      selectedRoomIndex: null,
      roomTextBoxData: [],
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
      return this.$store.state.templates;
    },
  },
  methods: {
    passFunction() {
      let display = this.$store.state.displays.find(
        (d) => d.uuid === this.displayUuid,
      );
      return display.roomCodes.length == 1;
    },
    handleTextBoxData(data) {
      this.textBoxData = data;
    },
    updateRoomTextBoxData() {
      if (this.selectedRoomIndex !== null) {
        const template = this.templates.find(
          (t) => t.uuid === this.selectedTemplateId,
        );
        if (template && template.roomData.length >= 2) {
          const start =
            template.roomData[1] +
            (this.selectedRoomIndex - 1) * template.roomData[2];
          const end = start + template.roomData[2];
          this.roomTextBoxData = this.textBoxData.filter(
            (box) => box.yPos >= start && box.yPos < end,
          );
          this.$emit("roomTextBoxData", this.roomTextBoxData);
        }
      }
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
      const {
        startDate,
        endDate,
        eventDescription,
        eventId,
        displayUuid,
        uuid,
        override,
        textBoxData,
        selectedRoomIndex,
      } = this;
      let content = null;
      if (selectedRoomIndex == null) {
        content = {
          scheduledContentUuid: uuid,
          displayContent: {
            imageFields: textBoxData,
            imageBase64: this.$refs.imagePrevieww.saveCanvas(),
          },
        };
      } else {
        this.updateRoomTextBoxData();
        content = {
          scheduledContentUuid: uuid,
          displayContent: {
            imageFields: this.roomTextBoxData,
            imageBase64: this.$refs.imagePreview1.saveCanvas(),
          },
        };
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
      };
        if(roomCodef!=null){
          data.room= roomCodef.code;
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
    },
    onSelectedTemplateChange(value) {
      this.image = null;
      let template = this.templates.find((t) => t.uuid === value);
      if (template) {
        this.selectedTemplateId = value;
        this.textBoxData = [
          ...this.textBoxData,
          ...(template.displayContent &&
            template.displayContent.imageFields.map((f) => ({ ...f }))),
        ];
        this.$emit("updateTextBoxData", this.textBoxData);
      }
    },
    onSelectedRoomChange() {
      let template = this.templates.find(
        (t) => t.uuid === this.selectedTemplateId,
      );
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
