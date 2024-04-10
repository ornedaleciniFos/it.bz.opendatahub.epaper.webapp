<template>
  <div>
    <h5>Text Box Data</h5>
    <template v-if="textBoxData.length > 0">
      <table class="styled-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Field</th>
            <th>Font Size</th>
            <th>X</th>
            <th>Y</th>
            <th>W</th>
            <th>H</th>
            <th>𝐼talic</th>
            <th>𝐁old</th>
            <th>Border</th>
            <th :disabled="room < 2">Repeat</th>
            <th>Option</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(box, index) in filteredTextBoxData"
            :key="index"
            :style="{ 'background-color': index === indexUp ? '#c0c0c0' : '' }"
          >
            <td>{{ index }}</td>
            <td>
              <select
                v-model="box.fieldType"
                style="width: 100%; font-size: 12px"
              >
                <option value="LOCATION_NAME">LOCATION_NAME</option>
                <option value="EVENT_DESCRIPTION">EVENT_DESCRIPTION</option>
                <option value="EVENT_START_DATE">EVENT_START_DATE</option>
                <option value="EVENT_END_DATE">EVENT_END_DATE</option>
                <option value="EVENT_ORGANIZER">EVENT_ORGANIZER</option>
                <option value="UPCOMING_EVENT_DESCRIPTION">
                  UPCOMING_EVENT_DESCRIPTION
                </option>
                <option value="UPCOMING_EVENT_START_DATE">
                  UPCOMING_EVENT_START_DATE
                </option>
                <option value="UPCOMING_EVENT_END_DATE">
                  UPCOMING_EVENT_END_DATE
                </option>
                <option value="UPCOMING_EVENT_ORGANIZER">
                  UPCOMING_EVENT_ORGANIZER
                </option>
                <option value="LOGO">LOGO</option>
                <option value="IMAGE">IMAGE</option>

                <!-- Add more options as needed -->
              </select>
            </td>
            <td>
              <input
                v-if="box.customText && box.customText !== 'img'"
                v-model.number="box.fontSize"
                type="number"
                class="small-input"
              />
              <input v-else disabled type="number" class="small-input" />
            </td>
            <td>
              <input
                v-model.number="box.xPos"
                :disabled="box.isRepeated || (box.repeat && !box.isRepeated)"
                type="number"
                class="small-input"
              />
            </td>
            <td>
              <input
                v-model.number="box.yPos"
                :disabled="box.isRepeated || (box.repeat && !box.isRepeated)"
                type="number"
                class="small-input"
              />
            </td>
            <td>
              <input
                v-model.number="box.width"
                :disabled="box.isRepeated || (box.repeat && !box.isRepeated)"
                type="number"
                class="small-input"
              />
            </td>
            <td>
              <input
                v-model.number="box.height"
                :disabled="box.isRepeated || (box.repeat && !box.isRepeated)"
                type="number"
                class="small-input"
              />
            </td>
            <td>
              <input
                v-if="box.customText && box.customText !== 'img'"
                v-model="box.italic"
                type="checkbox"
              />
              <input v-else disabled type="checkbox" />
            </td>
            <td>
              <input
                v-if="box.customText && box.customText !== 'img'"
                v-model="box.bold"
                type="checkbox"
              />
              <input v-else disabled type="checkbox" />
            </td>
            <td>
              <input v-model="box.border" type="checkbox" />
            </td>
            <td>
              <input
                v-model="box.repeat"
                :disabled="box.isRepeated"
                v-if="room >= 2"
                type="checkbox"
              />
            </td>
            <td>
              <button @click.prevent="deleteTextBox(index)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
    <template v-else>
      <p>No data available.</p>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    textBoxData: Array,
    updateTextBoxData: Function,
    handleRoomdata: Function,
    roomTextBoxData: Array,
    indexUp: Number,
    room: Number,
    selectedRoomIndex: Number,
    templateId: String,
  },
  computed: {
    filteredTextBoxData() {
      if (this.selectedRoomIndex !== null) {
        // Call the isEditable method here to filter out items based on editability
        return this.textBoxData.filter((box, index) => this.isEditable(index));
      }
      return this.textBoxData;
    },
  },
  watch: {
    textBoxData: {
      handler() {
        this.updateTextData();
      },
      deep: true, // Watch changes deeply in the array
    },
    selectedRoomIndex: {
      handler(val) {
        this.$emit("selectedRoomIndex", val);
        this.filteredTextBoxData;
      },
      deep: true,
    },
  },
  methods: {
    updateTextData() {
      this.$emit("updateTextBoxData", this.textBoxData);
      const roomTextBoxData =
        this.selectedRoomIndex !== null ? this.filteredTextBoxData : [];
      this.$emit("roomTextBoxData", roomTextBoxData);
    },
    deleteTextBox(index) {
      if (confirm("Are you sure you want to delete this text box?")) {
        this.textBoxData.splice(index, 1);
        //this.boxes.splice(index, 1);
        this.updateTextData();
      }
      this.$emit("boxes", this.textBoxData);
      this.$emit("updateTextBoxData", this.textBoxData);
      this.$emit("textBoxData", this.textBoxData);
    },
    isEditable(index) {
      const template = this.$store.state.templates.find(
        (t) => t.uuid === this.templateId,
      );

      if (
        this.selectedRoomIndex !== null &&
        template &&
        template.roomData.length >= 2
      ) {
        let start =
          template.roomData[1] +
          (this.selectedRoomIndex - 1) * template.roomData[2];
        let end = start + template.roomData[2];
        const isWithinRange =
          this.textBoxData[index].yPos >= start &&
          this.textBoxData[index].yPos < end;
        return (
          (this.textBoxData[index].isRepeat === false &&
            this.textBoxData[index].isRepeated === false) ||
          isWithinRange
        );
      }
      return false;
    },
  },
};
</script>
<style>
.styled-table {
  width: 100%;
  border-collapse: collapse;
  margin: 25px 0;
  text-align: left;
}

.styled-table th,
.styled-table td {
  padding: 4px 4px;
  border-bottom: 1px solid #ddd;
}

.styled-table th {
  background-color: #f2f2f2;
}
.small-input {
  width: 50px; /* Adjust the width as needed */
  /* Add any other styling you want for small inputs */
}
.active-row {
  background-color: #808080; /* Set your desired background color for the active row */
}
</style>
