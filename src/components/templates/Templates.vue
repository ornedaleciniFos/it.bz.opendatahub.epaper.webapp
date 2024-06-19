<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div>
    <b-button  to="/template-form" class="mb-2 show_details">
      Add template
    </b-button>
    <b-button variant="secondary" id="info-button" class="mb-2 ml-1" >
      Info
    </b-button>
    <b-popover target="info-button" triggers="hover">
      <template #title>Information about templates</template>
      <template #default>
        The "Add new template" button allows you to add a new template. You can add a new template, by inserting a name, description and resolution.<br> 
        The "Preview details" button previews the template image<br>
        The "Edit" button allows modification of the template.<br>
        The "Delete"" button deletes the template.
      </template>
    </b-popover>
    
    <b-table
      striped
      hover
      head-variant="dark"
      :items="templates"
      :fields="fields"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
    >
      <template v-slot:cell(name)="row">
        <b-col>
          {{ row.item.name }}
        </b-col>
      </template>
      <template v-slot:cell(description)="row">
        <b-col>
          {{ row.item.description }}
        </b-col>
      </template>
      <template v-slot:cell(options)="row">
        <b-button
          squared
          @click="row.toggleDetails"
          class="mr-2 show_details"
        >
          {{ row.detailsShowing ? "Hide" : "Preview" }} content
        </b-button>
        <b-button
          squared
          variant="warning"
          @click="editTemplate(row.item)"
          class="mr-2"
        >
          Edit
        </b-button>
        <b-button
          squared
          variant="danger"
          @click="deleteTemplate(row.item)"
          class="mr-2"
        >
          Delete
        </b-button>
      </template>
      <template v-slot:row-details="row">
        <b-img
          :src="`${apiUrl}/template/get-image/${
            row.item.uuid
          }?withTextFields=true&x=${Date.now()}`"
          fluid
          alt="No preview, edit the template and include an image"
        ></b-img>
      </template>
    </b-table>
  </div>
</template>

<script>
import toastPresets from "@/utils/toastPresets.js";

export default {
  data() {
    return {
      fields: [
        { key: "name", sortable: true },
        { key: "description", sortable: true },
        { key: "options", sortable: false },
      ],
      sortBy: "name",
      sortDesc: false,
    };
  },
  computed: {
    templates() {
      return this.$store.state.templates;
    },
    apiUrl() {
      return this.$store.state.URI;
    },
  },
  methods: {
    editTemplate(template) {
     
      if (template) {
        let formProps = {
          editMode: true,
          initialName: template.name,
          initialDescription: template.description,
          initialResolution: template.resolution,
          initialImageFields: 
          template.displayContent && template.displayContent.imageFields,
          templateId: template.uuid,
          initialMultipleRoom: template.multipleRoom,
          initialFooter: template.footer,
          initialInvert: template.roomData[3]==1?true:false,
          initialHeader:template.header,
          initialRoomData: template.roomData||[],
          initialNumRooms: template.roomData[0]||1,
        };
        this.$router.push({ name: "Template Form", params: formProps });
      }
    },
    deleteTemplate(template) {
      this.$bvModal
        .msgBoxConfirm(
          `Are you sure you want to delete this template (${template.name}) ?`
        )
        .then((okPressed) => {
          if (okPressed)
            this.$store.dispatch("deleteTemplate", template).catch(() => {
            this.$bvToast.toast(
                "Failed to delete template since it is attached to another display",
                toastPresets.errorMessage
              );
            });
        });
    },
  },
};
</script>
<style scoped>
.show_details {
  background-color: #1B5E20;
  color: white;
  font-weight: bold;
}
.show_details:hover {
  background-color: #43A047; /* Change background color on hover */
}
</style>