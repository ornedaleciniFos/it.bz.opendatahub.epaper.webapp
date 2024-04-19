<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <b-container>
    <b-row>
      <b-col>
        <b-row>
          <b-col> Display ID: {{ display.uuid }} </b-col>
        </b-row>
        <b-row>
          <b-col> Display name: {{ display.name }} </b-col>
        </b-row>

        <b-row>
          <b-col v-if="display.resolution">
            Resolution: {{ display.resolution.width }} x
            {{ display.resolution.height }} ({{ display.resolution.bitDepth }}
            bit)
          </b-col>
        </b-row>
        <b-row v-if="display.roomCodes">
          <b-col> Location: {{ formatRooms.join(", ") }} </b-col>
        </b-row>
        <b-row>
          <b-col :class="batteryLevelClass">
            Battery: {{ display.batteryPercentage }}%
          </b-col>
          <b-col v-if="display.errorMessage" class="errorMessage">
            Error: {{ display.errorMessage }}
          </b-col>
          <b-col v-if="display.warningMessage" class="warningMessage">
            Warning: {{ display.warningMessage }}
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            Image hash:
            {{
              display.currentImageHash ||
              "No hash (display did not request the image yet)"
            }}
          </b-col>
        </b-row>
        <b-row>
          <b-col v-if="display.state">
            <span v-if="!display.state.isSleeping">Is Sleeping</span>
            <span v-if="display.state.isSleeping">Is Awake</span>
          </b-col>
        </b-row>

        <b-row>
          <b-col v-if="display.lastState">
            Last State at
            {{ display.lastState | moment("dddd, MMMM Do YYYY, h:mm:ss a") }}
          </b-col>
          <b-col v-else class="errorMessage">
            No state, check if display is working
          </b-col>
        </b-row>

        <b-row class="buttons">
          <b-col>
            <b-row>
              <b-col>
                <b-button
                  squared
                  variant="warning"
                  :disabled="display.isLoading"
                  @click="editDisplay(display)"
                  >Edit display</b-button
                >
              </b-col>
              <b-col>
                <b-button
                  squared
                  variant="danger"
                  :disabled="display.isLoading"
                  @click="deleteDisplay(display)"
                  >Delete display</b-button
                >
              </b-col>
            </b-row>
          </b-col>
        </b-row>
      </b-col>

      <b-col>
        <b-img
          style="
            border: 2px solid black;
            border-radius: 5px;
            box-shadow:
              0 4px 8px 0 rgba(0, 0, 0, 0.2),
              0 6px 20px 0 rgba(0, 0, 0, 0.19);
          "
          :class="{ invertedImage: display.inverted }"
          :src="`${apiUrl}/display/get-image/${
            display.uuid
          }?x=${Date.now()}`"
          fluid
          alt="No image displayed"
        />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  props: {
    display: Object,
  },
  computed: {
    apiUrl() {
      return this.$store.state.URI;
    },
    batteryLevelClass() {
      if (this.display.batteryPercentage === 0) {
        return "errorMessage";
      }
      return null;
    },
    formatRooms() {
      let rooms = [];
      for (let code of this.display.roomCodes) {
        let room = this.$store.state.rooms.find((room) => room.code === code);
        if (room) {
          rooms.push(room.name);
        }
      }
      return rooms;
    },
  },
  methods: {
    editDisplay(display) {
      if (display) {
        let formProps = {
          editMode: true,
          display,
        };
        this.$router.push({ name: "Display Form", params: formProps });
      }
    },
    deleteDisplay(display) {
      this.$store.dispatch("deleteDisplay", display);
      this.$bvModal.hide("details-modal");
    },
  },
};
</script>

<style scoped>
.buttons {
  margin-top: 10%;
}

.errorMessage {
  color: red;
}

.warningMessage {
  color: rgb(201, 187, 0);
}
</style>
