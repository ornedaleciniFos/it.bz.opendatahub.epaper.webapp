<template>
  
        <b-card :title="pageTitle">
          <b-card-text>
            <b-form @submit.prevent="submitDisplay">
              <b-form-input v-model="uuid" label="ID" placeholder="Enter a display ID" :disabled="editMode" required />
              <b-form-input v-model="name" label="Name" placeholder="Enter a name" required/>
              <!-- Custom checkbox list within the dropdown with scrolling -->
              <div class="row">
                  <div class="col-md-4" >
                      <b-dropdown v-model="roomDropdown" text="Select rooms" toggle-class="btn-light" style="width: 100%;">
                         <b-dropdown-form>
                          <div style="max-height: 150px; overflow-y: auto;">
                              <div v-for="option in sortedRoomOptions" :key="option.value" class="d-block">
                                  <b-form-checkbox
                                    v-if="!option.disabled"
                                    v-model="roomCodes"
                                    :value="option.value"
                                  >
                                    {{ option.text }}
                                  </b-form-checkbox>
                                  <b-form-checkbox
                                    v-else
                                    disabled
                                  >
                                    {{ option.text }}
                                  </b-form-checkbox>
                                </div>

                            </div>

                        </b-dropdown-form>
                      </b-dropdown>
                  </div>
                  <div class="col-md-8">
                    <b-card-text>
                    <b-card>
                        <h6>Selected Rooms</h6>
                        <div ref="sortableList" class="sortable-list">
                          <!-- Add a ref attribute to the draggable element -->
                          <div v-for="selectedRoom in sortedSelectedRooms" :key="selectedRoom.value" class="d-flex mb-2">
                            <div class="handle pr-2" style="cursor: grab;">☰ {{ selectedRoom.text }}</div>
                            
                          </div>
                        </div>
                        </b-card>
                      </b-card-text>
                    </div>
               </div>
              <b-form-select v-model="resolutionUuid" :options="resolutions" required>
                <template v-slot:first>
                  <b-form-select-option :value="null" disabled>Select resolution...</b-form-select-option>
                </template>
              </b-form-select>
              <b-form-select v-model="templateUuid" :options="templates" :disabled="!enableTemplateSection">
                <template v-slot:first>
                  <b-form-select-option :value="null" disabled>Select template...</b-form-select-option>
                </template>
              </b-form-select>
              <b-button variant="success" type="submit"> Save </b-button>
            </b-form>
          </b-card-text>
        </b-card>
      
</template>

<script>
import Sortable from 'sortablejs';
import toastPresets from "@/utils/toastPresets.js";

export default {
  props: {
    editMode: Boolean,
    display: {
      type: Object,
      default: function () {
        return {};
      },
    },
    initialRoomCodes: {
      type: Array,
      default: function () {
        return [];
      },
    },
  },
  data() {
    return {
      name: this.display.name,
      uuid: this.display.uuid,
      resolutionUuid: this.display.resolution ? this.display.resolution.uuid : null,
      templateUuid: this.display.template ? this.display.template.uuid : null,
      locationUuid: this.display.locationUuid || null,
      roomCodes: this.initialRoomCodes,
      roomDropdown: false,
      roomOptions: [],
      sortedRoomsArray: [],
      sortable: null, 
    };
  },
  computed: {
      

    rooms() {
      return this.$store.state.rooms;
    },
    enableTemplateSection() {
      return this.resolutionUuid !== null && this.roomCodes.length > 1; 
    },
    resolutions(){
      return this.$store.state.resolutions.map((r) => {
        return {
          value: r.uuid,
          text: `${r.width} x ${r.height} (${r.bitDepth} bit)`,
        };
      });
    },
    templates() {
        return this.$store.state.templates.filter(t => {
            if (Array.isArray(t.roomData) && t.roomData.length > 0) {
              return  t.roomData[0] === this.roomCodes.length && t.resolution.uuid===this.resolutionUuid ;
            }
            return false;
          }).map(t => ({
            value: t.uuid,
            text: t.name
          }));
    },
    pageTitle() {
      return this.editMode ? "Edit display" : "Add display";
    },
    sortedRoomOptions() {
      const selectedCount = this.roomCodes.length;
      return this.roomOptions.map((option, index) => ({
        ...option,
        selected: this.roomCodes.includes(option.value),
        disabled: selectedCount >= 6 && !this.roomCodes.includes(option.value),
        position: index, 
      }));
    },
    sortedSelectedRooms() {
      return this.sortedRoomOptions
        .filter(option => option.selected)
        .sort((a, b) => a.position - b.position);
    },
  },
  watch: {
    rooms: {
      handler(newRooms) {
        this.roomOptions = newRooms.map((room) => {
          return {
            value: room.code,
            text: room.name,
          };
        });
      },
      immediate: true,
    },
  },
  methods: {

    handleDragEnd({ newIndex, oldIndex }) {
      if (newIndex !== oldIndex) {
        const draggedRoom = this.sortedSelectedRooms.splice(oldIndex, 1)[0];
        this.sortedSelectedRooms.splice(newIndex, 0, draggedRoom);
    
        // Update the positions in sortedRoomsArray based on the new order
        this.sortedRoomsArray = this.sortedSelectedRooms.map((room) => room.value);
      }
    },
    submitDisplay() {

      /* eslint-disable-next-line no-unused-vars */
      const { name, uuid, roomCodes, resolutionUuid, templateUuid, display } = this;
      
      let temp = null; // Initialize temp to null by default
      if (templateUuid !== null) {
        temp = this.$store.state.templates.find((t) => t.uuid === templateUuid);
      }
      const data = {
        ...display,
        name,
        uuid,
        roomCodes: this.sortedRoomsArray.length!==0 ? this.sortedRoomsArray: roomCodes ,
        resolution: this.$store.state.resolutions.find(
          (r) => r.uuid === resolutionUuid
        ),
        template:temp,
      };
      let storeOperation;
      if (this.editMode) {
        storeOperation = "updateDisplay";
      } else {
        storeOperation = "createDisplay";
      }

      this.$store
        .dispatch(storeOperation, data)
        .then(() => this.$router.replace("displays"))
        .catch((err) => {
          this.$bvToast.toast(
            "Failed to save display " + err,
            toastPresets.errorMessage
          );
        });
    },
   
    initSortable() {
      const el = this.$refs.sortableList;

      this.sortable = new Sortable(el, {
        handle: '.handle',
        onUpdate: this.handleDragEnd,
      });
    },
  },
  mounted() {
    this.initSortable();
  },
  created() {
      this.initSortable();

      // Set initial positions based on the order of roomOptions
      this.sortedRoomOptions.forEach((option, index) => {
        option.position = index;
      });

      this.sortedSelectedRooms.forEach((option, index) => {
        option.position = index;
      });
    },

};
</script>

<style scoped>
/* Add custom styles if needed */
.handle {
  cursor: grab;
}

/* Add a style for the sortable list to prevent text selection during dragging */
.sortable-list {
  user-select: none;
}
</style>
