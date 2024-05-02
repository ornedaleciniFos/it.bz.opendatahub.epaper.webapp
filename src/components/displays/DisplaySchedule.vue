<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div>
    <div>
      <b-button
        :to="{
          name: 'Display Schedule Form',
          params: { displayUuid: displayUuid },
        }"
        class="mb-2 show_details"
      >
        Plan new content
      </b-button>
      <b-button variant="secondary" id="info-button2" class="mb-2 ml-1">
        Info
      </b-button>
      <b-popover target="info-button2" triggers="hover">
        <template #title>Information about scheduled events</template>
        <template #default>
          The "Plan new content" button allows you to add a new event. You can
          add a description, time, template(if it is one room display), or room
          selection (if it is multiple room display). <br />
          The "Preview details" button previews the display based on the
          event.<br />
          The "Edit" button allows modification of the event.<br />
          The "Delete"" button deletes the event.
        </template>
      </b-popover>

      <b-table
        striped
        hover
        head-variant="dark"
        :items="scheduledContent"
        :fields="schedulerFields"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        responsive="sm"
        primary-key="primaryKey"
      >
        <template v-slot:cell(eventDescription)="row">
          <b-col>
            {{ row.item.eventDescription }}
          </b-col>
        </template>

        <template v-slot:cell(startDate)="row">
          <b-col>
            {{
              `${row.item.startDate.toLocaleDateString()} ${row.item.startDate.toLocaleTimeString()}`
            }}
          </b-col>
        </template>

        <template v-slot:cell(endDate)="row">
          <b-col>
            {{
              `${row.item.endDate.toLocaleDateString()} ${row.item.endDate.toLocaleTimeString()}`
            }}
          </b-col>
        </template>

        <template v-slot:cell(options)="row">
          <b-button
            squared
            variant="info"
            @click="row.toggleDetails"
            class="mr-2 show_details"
          >
            {{ row.detailsShowing ? "Hide" : "Preview" }}
            Details
          </b-button>
          <b-button
            squared
            variant="warning"
            @click="toggleEditForm(row.item)"
            class="mr-2"
          >
            Edit
          </b-button>
          <b-button
            v-if="row.item.eventId"
            squared
            :variant="row.item.disabled ? 'success' : 'danger'"
            @click="disableEventClick(row.item)"
            class="mr-2"
          >
            {{ row.item.disabled ? "Enable" : "Disable" }}
          </b-button>
          <b-button
            squared
            variant="danger"
            @click="deleteEventClick(row.item)"
            class="mr-2"
          >
            Delete
          </b-button>
        </template>
        <template v-slot:row-details="row">
          <p v-if="row.item.originalEventDescription">
            {{
              `Original event description: ${row.item.originalEventDescription}`
            }}
          </p>
          <p v-if="row.item.originalStartDate">
            {{
              `Original event start date: ${row.item.originalStartDate.toLocaleDateString()} ${row.item.originalStartDate.toLocaleTimeString()}`
            }}
          </p>
          <p v-if="row.item.originalEndDate">
            {{
              `Original event end date: ${row.item.originalEndDate.toLocaleDateString()} ${row.item.originalEndDate.toLocaleTimeString()}`
            }}
          </p>
          <b-img
            :src="`${apiUrl}/ScheduledContent/get-image/${
              row.item.uuid
            }?&x=${Date.now()}`"
            fluid
            alt="No preview, edit the event and include an image"
          ></b-img>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  data() {
    return {
      schedulerFields: [
        { key: "eventDescription", sortable: true },
        { key: "spaceDesc", sortable: true },
        { key: "startDate", sortable: true },
        { key: "endDate", sortable: true },
        { key: "options", sortable: false },
      ],
      showAddForm: false,
      sortBy: "startDate",
      sortDesc: false,
      rowToEdit: null,
    };
  },
  props: ["displayUuid"],
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
    apiUrl() {
      return this.$store.state.URI;
    },
  },
  mounted() {
    this.$store.dispatch("loadDisplaySchedule", this.displayUuid);
  },
  methods: {
    onEditFormComplete() {
      this.rowToEdit = null;
    },
    toggleEditForm(item) {
      this.rowToEdit = item;

      if (item) {
        let display = this.$store.state.displays.find(
          (d) => d.uuid === this.displayUuid,
        );
        let formProps = {};
        if (display.roomCodes.length > 1) {
          formProps = {
            editMode: true,
            eventId: item.eventId,
            initialStartDate: item.startDate,
            initialEndDate: item.endDate,
            initialDescription: item.eventDescription,
            initialTemplate: display.template.uuid,
            displayUuid: this.displayUuid,
            uuid: item.uuid,
            initialOverride: item.override,
            initialInclude: item.include,
            initialImageFields:
              item.displayContent && item.displayContent.imageFields,
            
          };
        } else {
          formProps = {
            editMode: true,
            eventId: item.eventId,
            initialStartDate: item.startDate,
            initialEndDate: item.endDate,
            initialDescription: item.eventDescription,
            initialTemplate: item.templateId,
            displayUuid: this.displayUuid,
            uuid: item.uuid,
            initialOverride: item.override,
            initialInclude: item.include,
            initialImageFields:
              item.displayContent && item.displayContent.imageFields,
          };
        }

        this.$router.push({
          name: "Display Schedule Form",
          params: formProps,
        });
      }
    },
    disableEventClick(item) {
      this.$store.dispatch("updateDisplaySchedule", {
        ...item,
        disabled: !item.disabled,
      });
    },
    deleteEventClick(item) {
      this.$store.dispatch("deleteDisplaySchedule", item);
    },
  },
};
</script>

<style scoped>
.show_details {
  background-color: #1b5e20;
  color: white;
  font-weight: bold;
}
.show_details:hover {
  background-color: #43a047; /* Change background color on hover */
}
</style>
