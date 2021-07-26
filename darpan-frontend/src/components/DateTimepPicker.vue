<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :nudge-right="40"
    transition="scale-transition"
    offset-y
    min-width="auto"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        :value="dateTimeText"
        label="Taken on"
        prepend-icon="mdi-calendar"
        v-bind="attrs"
        v-on="on"
        :disabled="disabled"
      >
      </v-text-field>
    </template>
    <v-tabs>
      <v-tab>Date</v-tab>
      <v-tab>Time</v-tab>
      <v-tab-item>
        <v-date-picker v-model="date" @input="onInput"></v-date-picker>
      </v-tab-item>
      <v-tab-item>
        <v-time-picker
          v-model="time"
          use-seconds
          ampm-in-title
          @input="onInput"
        ></v-time-picker>
      </v-tab-item>
    </v-tabs>
  </v-menu>
</template>

<script>
const moment = require("moment");

export default {
  name: "DateTimePicker",
  data() {
    return {
      menu: false,
      date: moment(this.dateTime).format("YYYY-MM-DD"),
      time: moment(this.dateTime).format("HH:mm:ss"),
    };
  },
  props: {
    dateTime: {
      type: String,
    },
    disabled: {
      type: Boolean,
    },
  },
  watch: {
    dateTime: function (newVal) {
      this.date = moment(newVal).format("YYYY-MM-DD");
      this.time = moment(newVal).format("HH:mm:ss");
    },
  },
  computed: {
    dateTimeText: function () {
      return moment(this.date + "T" + this.time).format(
        "dddd, MMMM Do, YYYY, h:mm:ss a"
      );
    },
  },
  methods: {
    onInput() {
      this.$emit("input", moment(this.date + "T" + this.time).format());
    },
  },
};
</script>