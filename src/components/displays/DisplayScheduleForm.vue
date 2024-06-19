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
           <!--  <div class="col-md-3 d-flex align-items-center justify-content-end">
              <label class="mb-0 s">
                <input type="checkbox" v-model="include" /> Include to multiple
                Screen
              </label>
            </div>-->
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
          v-if="shouldShowRoomSection"
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
              />
            </div>
          </b-card-text>
        </b-card>
        <b-card v-else>
          <b-card-text>
            <div>
              <ImageFieldSchedule
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
          :templateId="templateUuid"
          ref="imagePreview1"
        />
      </b-card>
      <b-card v-else class="imagePrevieww">
        Display preview
        <ImagePreviewSchedule
          @updateTextBoxData="handleTextBoxData"
          :resolutionUuid="resolutionUuid"
          :textBoxData="textBoxData"
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
import ImagePreviewSchedule from "@/components/displayContent/ImagePreviewSchedule.vue";
import ImageFieldSchedule from "@/components/displayContent/ImageFieldSchedule.vue";
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
    ImagePreviewSchedule,
    ImageFieldSchedule,
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
    indexUp: {
      deep: true,
      handler() {},
    },
  },
  mounted() {
    let display = this.$store.state.displays.find(
      (d) => d.uuid === this.displayUuid,
    );
    if (display && display.template) {
      let template = this.$store.state.templates.find(
        (t) => t.uuid === display.template.uuid,
      );
      if (template) {
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
      templateId: this.initialTemplate,
      override: this.initialOverride || false,
      include: this.initialInclude || false,
      image: null,
      imageFields: this.initialImageFields || [],
      textBoxData: this.initialImageFields || [],
      selectedRoom: this.initialRoom,
      roomTextBoxData: [],
      indexUp: null,
      roomData: [],
    };
  },
  computed: {
    scheduledContent() {
      let displaySchedules =
        this.$store.state.displaySchedules[this.displayUuid];
      
      if (displaySchedules)
        displaySchedules = displaySchedules.map((item) => {
          item._rowVariant = item.disabled ? "danger" : "";
          item.startDate = new Date(item.startDate);
          item.endDate = new Date(item.endDate);
          if (item.eventId) {
            item.originalStartDate = new Date(item.originalStartDate);
            item.originalEndDate = new Date(item.originalEndDate);
          }
          item.primaryKey = item.uuid || item.eventId;
          return item;
        });
      return displaySchedules;
    },
    
    resolutionUuid() {
      let display = this.$store.state.displays.find(
        (d) => d.uuid === this.displayUuid,
      );
      let resolution = this.$store.state.resolutions.find(
        (r) => r.uuid === display.resolution.uuid,
      );

      return resolution ? resolution.uuid : null;
    },
    template() {
      return this.display.template;
    },
    templateUuid() {
      return this.display.template.uuid;
    },
    display() {
      let display = this.$store.state.displays.find(
        (d) => d.uuid === this.displayUuid,
      );
      return display;
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
    shouldShowRoomSection() {
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
    checkNoEventWithin30Min(startDate, endDate) {
      let displaySchedules =this.$store.state.displaySchedules[this.displayUuid].filter(e => e.uuid !== this.uuid);
     if (displaySchedules) {
        if (this.override) return true;
    
        const thirtyMinutesInMs = 30 * 60 * 1000;
    
        const endThreshold = new Date(endDate.getTime() + thirtyMinutesInMs);
        const startThreshold = new Date(startDate.getTime() - thirtyMinutesInMs);
    
        const startsWithin30MinBefore = displaySchedules.some(
          (e) => {
            const eventStart = new Date(e.startDate);
            const eventEnd = new Date(e.endDate);
            return eventStart < startDate && eventEnd > startThreshold;
          }
        );
    
        const endsWithin30MinAfter = displaySchedules.some(
          (e) => {
            const eventStart = new Date(e.startDate);
            const eventEnd = new Date(e.endDate);
            return eventEnd > endDate && eventStart < endThreshold;
          }
        );
    
        return !startsWithin30MinBefore && !endsWithin30MinAfter;
      }
      return true;
    },
    checkForDuplicates() {
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
    updateRoomTextBoxData() {},
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
    onSelectedTemplateChange(value) {
      let template = this.$store.state.templates.find((t) => t.uuid === value);
      
      if (template && template.multipleRoom) {
        // Set header, footer, and room data from the template
        this.header = template.header;
        this.footer = template.footer;
        this.roomData = template.roomData;
        // Filter out non-repeated fields from the template
        const repeatedFields = template.displayContent.imageFields.filter(
          (field) => field.repeat,
        );

        // Populate textBoxData if it's null
        if (!this.textBoxData) {
          this.textBoxData = repeatedFields.map((field) => ({
            xPos: field.xPos,
            yPos: field.yPos,
            width: field.width,
            height: field.height,
            customText: field.customText,
            fieldType: field.fieldType,
            fontSize: field.fontSize,
            bold: field.bold,
            italic: field.italic,
            image: field.image,
            showDeleteButton: field.showDeleteButton,
            border: field.border,
            repeat: field.repeat,
            isRepeated: field.isRepeated,
          }));
        } else {
          // Filter out duplicate fields and add new fields from the template
          const newFields = repeatedFields.filter(
            (field) =>
              !this.textBoxData.some(
                (textBox) =>
                textBox.fieldType === field.fieldType
              ),
          );
          const newData = [...this.textBoxData, ...newFields];
          // Handle room-specific data if necessary
          if (template.multipleRoom) {
            const start = template.roomData[1];
            const end = start + template.roomData[2];
            this.textBoxData = newData.filter(
              (box) => box.yPos >= start && box.yPos < end,
            );
          } else {
            this.textBoxData = newData;
          }
        }

        // Emit updated textBoxData
        this.$emit("updateTextBoxData", this.textBoxData);
        this.$emit("textBoxData", this.textBoxData);
      } else {
        const newFields = template.displayContent.imageFields.filter(
          (field) =>
            !this.textBoxData.some(
              (textBox) =>
                textBox.fieldType === field.fieldType
            ),
        );
        const newData = [...this.textBoxData, ...newFields];
        this.textBoxData = newData;
        this.$emit("updateTextBoxData", newData);
        this.$emit("textBoxData", newData);
      }
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
            imageFields: this.textBoxData,
          },
        };

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
        if (!this.checkNoEventWithin30Min(data.startDate, data.endDate)) {
            this.$bvToast.toast("There are events existing 30 minutes before or after the given date, press override if you want to override it", {
              title: "Error",
              variant: "danger",
              solid: true,
            });
            return;
          }
        if (data.startDate > data.endDate) {
          this.$bvToast.toast("The End Date must come after the Start Date", {
            title: "Error",
            variant: "danger",
            solid: true,
          });
          return;
        }

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
