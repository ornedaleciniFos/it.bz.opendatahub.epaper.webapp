<!--
SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>

SPDX-License-Identifier: AGPL-3.0-or-later
-->
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
            <th>Italic</th>
            <th>Bold</th>
            <th>Border</th>
            <th>Invert</th>
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
                :disabled="box.isRepeated"
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
                <option value="OTHER">OTHER</option>

                <!-- Add more options as needed -->
              </select>
            </td>
            <td>
              <input
                v-if="box.customText && box.customText !== 'img'"
                v-model.number="box.fontSize"
                :disabled="box.isRepeated"
                type="number"
                class="small-input"
              />
              <input v-else disabled type="number" class="small-input" />
            </td>
            <td>
              <input
                v-model.number="box.xPos"
                :disabled="box.isRepeated"
                type="number"
                class="small-input"
              />
            </td>
            <td>
              <input
                v-model.number="box.yPos"
                :disabled="box.isRepeated"
                type="number"
                class="small-input"
              />
            </td>
            <td>
              <input
                v-model.number="box.width"
                :disabled="box.isRepeated"
                type="number"
                class="small-input"
              />
            </td>
            <td>
              <input
                v-model.number="box.height"
                :disabled="box.isRepeated"
                type="number"
                class="small-input"
              />
            </td>
            <td>
              <input
                v-if="box.customText && box.customText !== 'img'"
                v-model="box.italic"
                :disabled="box.isRepeated"
                type="checkbox"
              />
              <input v-else disabled type="checkbox" />
            </td>
            <td>
              <input
                v-if="box.customText && box.customText !== 'img'"
                v-model="box.bold"
                :disabled="box.isRepeated"
                type="checkbox"
              />
              <input v-else disabled type="checkbox" />
            </td>
            <td>
              <input v-model="box.border" :disabled="box.isRepeated" type="checkbox" />
            </td>
            <td>
              <input
                v-if="box.customText && box.customText !== 'img'"
                v-model="box.invert"
                :disabled="box.isRepeated"
                type="checkbox"
              />
              <input v-else disabled type="checkbox" />
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
    indexUp: Number,
    room: Number,
  },
  computed: {
    filteredTextBoxData() {
      return this.textBoxData;
    },
  },
  watch: {
    textBoxData: {
      handler() {
        this.updateTextData();
      },
      deep: true,
    },
  },
  methods: {
    updateTextData() {
      this.$emit("updateTextBoxData", this.textBoxData);
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
  width: 70px;
}
.active-row {
  background-color: #808080;
}
</style>
