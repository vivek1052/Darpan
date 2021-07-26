<template>
  <v-dialog
    v-model="dialog"
    :width="isMobile ? '100%' : '30%'"
    hide-overlay
    :fullscreen="isMobile"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn color="primary" icon v-on="on" v-bind="attrs">
        <v-icon>mdi-calendar-range</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-toolbar dense>
        <v-spacer></v-spacer>
        <v-toolbar-title>Update Date/Time</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <template v-slot:extension>
          <v-tabs v-model="tab">
            <v-tab>Fixed Date</v-tab>
            <v-tab>+/- Date Series</v-tab>
          </v-tabs>
        </template>
      </v-toolbar>
      <v-tabs-items v-model="tab">
        <v-tab-item>
          <v-container fluid>
            <date-time-picker
              :disabled="false"
              :dateTime="constDateTime"
              @input="(i) => (constDateTime = i)"
            ></date-time-picker>

            <v-btn width="100%" @click="onConstDataUpdate" color="primary">
              <v-icon>mdi-check</v-icon>
              Execute
            </v-btn>
          </v-container>
        </v-tab-item>
        <v-tab-item>
          <v-container>
            <v-btn-toggle v-model="toggleAddSub" mandatory dense>
              <v-btn>
                <v-icon>mdi-plus</v-icon>
              </v-btn>
              <v-btn>
                <v-icon>mdi-minus</v-icon>
              </v-btn>
            </v-btn-toggle>
            <v-row class="mt-3">
              <v-col>
                <v-select
                  :full-width="false"
                  v-model="days"
                  :items="dayList"
                  label="Days"
                >
                </v-select>
              </v-col>
              <v-col>
                <v-select
                  :full-width="false"
                  v-model="hours"
                  :items="hourList"
                  label="Hours"
                >
                </v-select>
              </v-col>
              <v-col>
                <v-select
                  :full-width="false"
                  v-model="minutes"
                  :items="minuteList"
                  label="Minutes"
                >
                </v-select>
              </v-col>
              <v-col>
                <v-select
                  :full-width="false"
                  v-model="secs"
                  :items="secList"
                  label="Seconds"
                >
                </v-select>
              </v-col>
            </v-row>
            <v-btn color="primary" width="100%" @click="onDataSeriesChange">
              <v-icon>mdi-check</v-icon>
              Execute
            </v-btn>
          </v-container>
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </v-dialog>
</template>

<script>
import dateTimePicker from "./DateTimepPicker.vue";
const axios = require("axios");
const moment = require("moment");
const mobile = require("is-mobile");

export default {
  name: "MassDateEdit",
  data() {
    return {
      dialog: false,
      tab: "",
      isMobile: mobile(),
      constDateTime: moment().utc().format(),
      toggleAddSub: "",
      days: 0,
      hours: 0,
      minutes: 0,
      secs: 0,
    };
  },
  components: {
    dateTimePicker,
  },
  props: {
    selectedPhotoGuids: {
      type: Array,
    },
  },
  computed: {
    dayList: () => [...Array(32).keys()],
    hourList: () => [...Array(25).keys()],
    minuteList: () => [...Array(61).keys()],
    secList: () => [...Array(61).keys()],
  },
  methods: {
    onConstDataUpdate() {
      debugger;
      const axiosPromise = [];
      for (const guid of this.selectedPhotoGuids) {
        axiosPromise.push(
          axios.patch(`/darpan/Files/${guid}`, {
            takenDateTime: this.constDateTime,
          })
        );
      }

      Promise.all(axiosPromise)
        .then((responses) => {
          const hashes = [];
          for (const res of responses) {
            hashes.push(res.data.hash);
          }
          this.$toasted.success(`${hashes.length} photos updated`);
        })
        .catch((err) => {
          console.log(err);
          this.$toasted.error("Error Occured");
        });
    },

    onDataSeriesChange() {
      const axiosPromises = [];
      for (const guid of this.selectedPhotoGuids) {
        axiosPromises.push(
          axios.get(`/darpan/Files/${guid}?$select=takenDateTime`)
        );
      }

      Promise.all(axiosPromises)
        .then((responses) => {
          const axiosPatchPromises = [];
          for (const res of responses) {
            const newDate = moment(res.data.takenDateTime);

            if (!newDate.isValid()) continue;

            if (this.toggleAddSub == 0) {
              newDate
                .add(this.days, "d")
                .add(this.hours, "h")
                .add(this.minutes, "m")
                .add(this.secs, "s");
            } else if (this.toggleAddSub == 1) {
              newDate
                .subtract(this.days, "d")
                .subtract(this.hours, "h")
                .subtract(this.minutes, "m")
                .subtract(this.secs, "s");
            }

            if (newDate.isValid())
              axiosPatchPromises.push(
                axios.patch(`/darpan/Files/${res.data.hash}`, {
                  takenDateTime: newDate.format(),
                })
              );
          }

          return Promise.all(axiosPatchPromises);
        })
        .then((responses) => {
          const hashes = [];
          for (const res of responses) {
            hashes.push(res.data.hash);
          }

          this.$toasted.success(`${hashes.length} photos updated`);
        })
        .catch((err) => {
          console.log(err);
          this.$toasted.error("Error Occured");
        });
    },
  },
};
</script>