<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div>
    <div>
      <b-button variant="secondary" id="info-button3" class="mb-2 ml-1">
        Info
      </b-button>
      <b-popover target="info-button3" triggers="hover">
        <template #title>Information about events</template>
        <template #default>
         In this section you can find all events that have the permission to be included in the 
         display with multiple events.<br />
          The "Preview Details" button previews the original event.<br />
          The "Add" button add the event as a new event for multiple event display.
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
            variant="danger"
            @click="addForm(row.item)"
            class="mr-2 added"
          >
            Add
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
            }?withTextFields=true&x=${Date.now()}`"
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
      let display = this.$store.state.displays.find(
        (d) => d.uuid === this.displayUuid,
      );
      let displaySchedules = [];
      if (display.roomCodes.length > 1) {
        for (const displays of this.$store.state.displays) {   
          if (
            displays.roomCodes.length == 1 && displays.uuid in this.$store.state.displaySchedules
            //this.$store.state.displaySchedules.hasOwnProperty(displays.uuid)
          ) {
            const events = this.$store.state.displaySchedules[displays.uuid];
            if (events) {
              for (const event of events) {
                if (display.roomCodes.includes(event.room) && event.include) {
                  displaySchedules.push(event);
                }
              }
            }
          }
        }
      } else {
        displaySchedules = this.$store.state.displaySchedules[this.displayUuid];
      }

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
    editContent(item) {
      let display = this.$store.state.displays.find(
        (d) => d.uuid === this.displayUuid,
      );

      let newData = [];
      if (
        item.displayContent &&
        item.displayContent.imageFields &&
        display.template.displayContent.imageFields
      ) {
        const start = display.template.roomData[1];
        const end = start + display.template.roomData[2];
        let boxes = display.template.displayContent.imageFields.filter(
          (box) => box.yPos >= start && box.yPos <= end && box.isRepeated,
        );
        item.displayContent.imageFields.forEach((itemBox) => {
          let matched = false;
          boxes.forEach((box) => {
            if (box.fieldType === itemBox.fieldType) {
              matched = true;
              box.customText = itemBox.customText;
              newData.push(box);
            }
          });
          if (!matched) {
            newData.push(itemBox);
          }
        });
      }
      let content = [];
      for (let i = 0; i < newData.length; i++) {
        const { uuid, ...imageFieldWithoutUUID } = newData[i];
        // eslint-disable-next-line no-console
        console.log(uuid);
        content.push(imageFieldWithoutUUID);
      }
      return content;
    },

    addForm(item) {
      this.rowToEdit = item;
      const data = {
        startDate: item.startDate,
        endDate: item.endDate,
        eventDescription: item.eventDescription,
        override: item.override,
        include: item.include,
        room: item.room,
      };
      const { uuid } = this;
      const imageFieldsContent = this.editContent(item);
      const content = {
        scheduledContentUuid: uuid,
        displayContent: {
          imageFields: imageFieldsContent,
          imageBase64: item.displayContent.imageBase64,
        },
      };
      if (item.displayUuid != this.displayUuid) {
        data.displayUuid = this.displayUuid;
        let storeOperation = "createDisplaySchedule";
        this.$store.dispatch(storeOperation, data).then((data) => {
          if (data) {
            content.scheduledContentUuid = data.uuid;
          }
          return this.$store.dispatch("updateScheduledContent", content);
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

.added {
  background-color: #FFC300;
  color: black;
  font-weight: bold;
}

.added:hover {
  background-color: red; /* Change background color on hover */
}
</style>
