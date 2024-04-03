<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <b-form @submit.prevent="submitTemplate">
    <div class="editor">
    
      <b-card :title="pageTitle" class="form_card">
  
        <b-card-text>
          <b-form-input
            v-model="name"
            label="Name"
            placeholder="Enter a name"
            required
          />
          <b-form-input
            v-model="description"
            label="Description"
            placeholder="Enter a description"
          />
          <div id="div3">
            <div class="flex-container">
              <div class="left-content">
                <b-form-select v-model="resolutionUuid" :options="resolutions">
                  <template v-slot:first>
                    <b-form-select-option :value="null" disabled
                      >Select resolution...</b-form-select-option
                    >
                  </template>
                </b-form-select>
                <b-form-group v-if="multipleRoom" class="border p-1">
                  <label for="numRooms" class="d-flex align-items-center"
                    >Rooms:
                    <b-form-input
                      v-model="numRooms"
                      id="numRooms"
                      type="number"
                      min=2
                      max=6
                    ></b-form-input>
                  </label>
                </b-form-group>
              </div>
              <div class="right-content">
                <b-card v-if="resolutionUuid">
                  <label>
                    <input type="checkbox" v-model="multipleRoom" /> Multiple
                    Room
                  </label>
                  <div v-if="multipleRoom">
                    <label>
                      <input type="checkbox" v-model="header" /> Header
                    </label>
                    <span style="margin-right: 10px"></span>
                    <label>
                      <input type="checkbox" v-model="footer" /> Footer
                    </label>
                  </div>
                </b-card>
              </div>
            </div>
          </div>

          <DisplayDataTemplate
            :textBoxData="textBoxData"
            @updateTextBoxData="handleTextBoxData"
            :indexUp="indexUp"
            ref="displayDataTemplate"
            :room="parseInt(numRooms)"
          />
        </b-card-text>
      </b-card>
      
      <b-card v-if="resolutionUuid" class="imagePrevieww">
        Template preview

        <ImagePreview
          @updateTextBoxData="handleTextBoxData"
          :resolutionUuid="resolutionUuid"
          :textBoxData="textBoxData"
          :room="parseInt(numRooms)"
          :multipleRoom="multipleRoom"
          :header="header"
          :footer="footer"
          :indexUp="indexUp"
          @updateIndexUp="updateIndexUp"
          :roomData="roomData"
          @updateRoomData="updateRoomData"
          ref="imagePrevieww"
        />
      </b-card>
    </div>
    <div>
      <b-button variant="danger" to="/templates" class="mt-2 mr-2">
        Cancel
      </b-button>
      <b-button variant="success" type="submit" class="mt-2">
        Save template
      </b-button>
    </div>
  </b-form>
</template>

<script>
import toastPresets from "@/utils/toastPresets.js";
import ImagePreview from "@/components/displayContent/ImagePreview.vue";
import DisplayDataTemplate from "@/components/displayContent/DisplayDataTemplate.vue";

export default {
  props: {
    editMode: Boolean,
    initialName: String,
    initialDescription: String,
    initialImageFields: Array,
    templateId: String,
    initialResolution: Object,
    initialFooter: Boolean,
    initialHeader: Boolean,
    initialMultipleRoom: Boolean,
    initialRoomData: {
        type: Array,
        default: () => [] // Set a default empty array if initialRoomData is not provided
      },
  },
  components: {
    ImagePreview,
    DisplayDataTemplate,
  },
  data() {
    return {
      name: this.initialName,
      resolutionUuid: this.initialResolution
        ? this.initialResolution.uuid
        : null,
      description: this.initialDescription,
      image: null,
      focusedFieldIndex: null,
      numberInput: 1,
      isChecked: false,
      textBoxData: this.initialImageFields || [],
      multipleRoom: this.initialMultipleRoom || false,
      numRooms: this.initialRoomData[0]|| 1,
      header: this.initialHeader || false,
      footer: this.initialFooter || false,
      roomData: this.initialRoomData || [],
      indexUp: null,
      room:1,
    };
  },
  computed: {
    pageTitle() {
      return this.editMode ? "Edit template" : "Add template";
    },
    imageSrc() {
      const resolutionQuery = this.resolutionUuid
        ? `&resolution=${this.resolutionUuid}`
        : "";
      return this.editMode && !this.image
        ? `${this.$store.state.URI}/template/get-image/${
            this.templateId
          }?x=${Date.now()}${resolutionQuery}`
        : this.image;
    },
    resolutions() {
      return this.$store.state.resolutions.map((r) => {
        return {
          value: r.uuid,
          text: `${r.width} x ${r.height} (${r.bitDepth} bit)`,
        };
      });
    },
    selectedResolution() {
      return (
        this.$store.state.resolutions.find(
          (r) => r.uuid === this.resolutionUuid,
        ) || {}
      );
    },
  },
  watch: {
    textBoxData: {
      deep: true,
      handler(val) {
        this.handleTextBoxData(val);
      },
    },
    multipleRoom: function (newVal) {
      if (newVal) {
        this.numRooms = this.numRooms > 1 ? this.numRooms : 2;
        this.$set(this.roomData, 0, this.numRooms);
      } else {
        this.numRooms = 1;
      }
    },
    header: {
      deep: true,
      handler() {},
    },
    footer: {
      deep: true,
      handler() {},
    },
    
    imageFields: {
      deep: true,
      handler() {
        this.refreshImagePrevieww();
      },
    },
    indexUp: {
      deep: true,
      handler() {},
    },
    numRooms: {
        deep: true,
        handler(val) {
          this.$set(this.roomData, 0, val);
        },
      },
  },

  methods: {
    handleTextBoxData(data) {
      this.textBoxData = data;
    },
    updateRoomData(roomData) {
      this.roomData = roomData;
    },
    updateIndexUp(newValue) {
      this.indexUp = newValue;
    },

    refreshImagePreview() {
      this.$refs.imagePreview.refreshImageCanvas();
    },

    submitTemplate() {
      const {
        name,
        description,
        resolutionUuid,
        multipleRoom,
        templateId,
        textBoxData,
        footer,
        header,
        roomData,
        numRooms,
      } = this;
      const templateContent = {
        displayContent: {
          imageFields: textBoxData,

          imageBase64: this.$refs.imagePrevieww.saveCanvas(),
        },
        templateUuid: templateId,
      };
      this.$set(roomData, 0, numRooms);
      const template = {
        name,
        description,
        resolutionUuid,
        resolution: this.$store.state.resolutions.find(
          (r) => r.uuid === resolutionUuid,
        ),
        multipleRoom,
        roomData,
        header,
        footer,
      };
      let storeOperation;
      if (this.editMode) {
        storeOperation = "updateTemplate";
        template.uuid = templateId;
      } else {
        storeOperation = "createTemplate";
      }

      this.$store
        .dispatch(storeOperation, template)
        .then((template) => {
          if (template) {
            templateContent.templateUuid = template.uuid;
          }
          return this.$store.dispatch("updateTemplateContent", templateContent);
        })
        .then(() => this.$router.replace("templates"))
        .catch((err) => {
          this.$bvToast.toast(
            "Failed to save template " + err,
            toastPresets.errorMessage,
          );
        });
    },
  },
};
</script>

<style scoped>
.flex-container {
  display: flex;
}

.left-content {
  flex: 0 0 70%;
  padding-right: 10px; /* Add some spacing between the left and right content */
}

.right-content {
  flex: 0 0 30%;
}
.editor {
  overflow: auto;
}
.form_card {
  width: 50%;
  float: left;
  margin-bottom: 5px;
}
.imagePrevieww {
  width: 50%;
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
