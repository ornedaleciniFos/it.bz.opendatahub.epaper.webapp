<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div>
    <b-button variant="success" to="/display-form" class="mb-2">
      Add display
    </b-button>
    <b-table
      striped
      hover
      head-variant="dark"
      :items="formatDisplayRows"
      :fields="fields"
    >
      <template v-slot:cell(show_details)="row">
        <b-button
          squared
          variant="info"
          @click="openDisplayDetails(row.item)"
          class="mr-5"
        >
          {{ row.detailsShowing ? "Hide" : "Show" }} Details
        </b-button>
      </template>

      <template v-slot:cell(last_state)="row">
        <b-col class="w-100">
          {{
            row.item.lastState &&
            `${row.item.lastState.toLocaleDateString()} ${row.item.lastState.toLocaleTimeString()}`
          }}
        </b-col>
      </template>
    </b-table>
    <b-modal id="details-modal" hide-footer size="xl" title="Display details">
      <b-tabs content-class="mt-3" class="detailModal" v-if="selectedDisplay">
        <b-tab lazy title="Information">
          <DisplayInformation lazy :display="selectedDisplay" />
        </b-tab>
        <b-tab title="Scheduler">
          <DisplaySchedule
            lazy
            :scheduled-content="selectedDisplay.scheduledContent"
            :display-uuid="selectedDisplay.uuid"
          />
        </b-tab>
      </b-tabs>
    </b-modal>
  </div>
</template>

<script>
import DisplayInformation from "./DisplayInformation.vue";
// import DisplaySchedule from "./DisplaySchedule.vue";

export default {
  components: {
    DisplayInformation,
    // DisplaySchedule,
  },
  props: {
    // --- These props are used in QR code link ---
    displayId: String,
    screenWidth: Number,
    screenHeight: Number,
    screenBitDepth: Number,

    // ---
  },
  data() {
    return {
      selectedDisplay: null,
      fields: [
        { key: "name", sortable: true },
        { key: "rooms", sortable: true },
        { key: "status", sortable: true },
        { key: "last_state", sortable: false }, // Cannot set "sortKey" for date sorting, need to update bootstrap-vue
        { key: "show_details", sortable: false },
      ],
    };
  },
  computed: {
    displays() {
      return this.$store.state.displays;
    },
    formatDisplayRows() {
      if (!this.displays) return [];
      return this.displays.map((item) => {
        let rooms = [];
        if (item.roomCodes) {
          for (let code of item.roomCodes) {
            let room = this.$store.state.rooms.find(
              (room) => room.code === code
            );
            if (room) {
              rooms.push(room.name);
            }
          }
        }
        rooms = rooms.length > 0 ? rooms.join(", ") : "No room assigned";
        item.rooms = rooms;
        item.lastState = item.lastState && new Date(item.lastState);
        if (
          !item.lastState ||
          Date.now() - item.lastState > this.NO_STATUS_THRESHOLD
        ) {
          item.status = "No status";
          item._rowVariant = "danger";
        } else if (item.errorMessage) {
          item.status = "Error";
          item._rowVariant = "danger";
        } else if (item.batteryPercentage <= 0) {
          item.status = "Dead battery";
          item._rowVariant = "danger";
        } else if (item.batteryPercentage <= this.LOW_BATTERY_THRESHOLD) {
          item.status = "Low battery";
          item._rowVariant = "warning";
        } else if (item.warningMessage) {
          item.status = "Warning";
          item._rowVariant = "warning";
        } else {
          item.status = "OK";
        }
        return item;
      });
    },
  },
  created() {
    this.LOW_BATTERY_THRESHOLD = 10;
    this.NO_STATUS_THRESHOLD = 10800000; //3 hours
  },
  mounted() {
    //Check if we received display id via props

    if (this.displayId) {
      let display = this.displays.find((d) => d.uuid === this.displayId);
      if (display) {
        // Activate detail modal
        this.openDisplayDetails(display);
      } else {
        // No display found, go to display insert form
        let display = {
          uuid: this.displayId,
        };

        display.resolution = this.$store.state.resolutions.find(
          (r) =>
            r.width === this.screenWidth &&
            r.height === this.screenHeight &&
            r.bitDepth === this.screenBitDepth
        );
        let formProps = {
          display,
        };
        this.$router.replace({ name: "Display Form", params: formProps });
      }
    }
  },
  methods: {
    setIgnoreSchedule(displayUuid, ignoreFlag) {
      let display = this.displays.find((d) => d.uuid === displayUuid);
      if (display) {
        display.ignoreScheduledContent = ignoreFlag;
        this.$store.dispatch("updateDisplay", display);
      }
    },
    openDisplayDetails(display) {
      this.selectedDisplay = display;
      this.$bvModal.show("details-modal");
    },
  },
};
</script>

<style scoped>
.detailModal {
  text-align: center;
}
/* Custom column width for each field */
.b-table th:nth-child(1),
.b-table td:nth-child(1) {
  width: 20%; /* Adjust the width as needed */
}
.b-table th:nth-child(2),
.b-table td:nth-child(2) {
  width: 20%; /* Adjust the width as needed */
}
.b-table th:nth-child(3),
.b-table td:nth-child(3) {
  width: 20%; /* Adjust the width as needed */
}
.b-table th:nth-child(4),
.b-table td:nth-child(4) {
  width: 20%; /* Adjust the width as needed */
}
.b-table th:nth-child(5),
.b-table td:nth-child(5) {
  width: 20%; /* Adjust the width as needed */
}
</style>
