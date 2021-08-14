<template>
  <v-dialog
    v-model="dialog"
    :width="isMobile ? '100%' : '30%'"
    hide-overlay
    :fullscreen="isMobile"
    scrollable
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn color="primary" icon v-on="on" v-bind="attrs">
        <v-icon>mdi-map-marker-outline</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-toolbar dense>
        <v-text-field
          hide-details
          prepend-icon="mdi-crosshairs-gps"
          single-line
          v-model="query"
        ></v-text-field>
        <v-btn icon @click="onQuery" color="primary">
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn icon @click="dialog = false" color="primary">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-container>
        <v-list>
          <v-list-item-group v-model="selectedLocation" color="primary">
            <v-list-item v-for="(place, i) in queryResult" :key="i">
              <v-list-item-content>
                <v-list-item-title> {{ place.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ place.address }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-container>
      <v-card-actions>
        <v-btn width="100%" color="primary" @click="onLocationSelected">
          Select
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const axios = require("axios");
const mobile = require("is-mobile");
export default {
  name: "MassLocationEdit",
  data() {
    return {
      dialog: false,
      isMobile: mobile(),
      queryResult: [],
      query: "",
      selectedLocation: "",
    };
  },
  props: {
    selectedPhotoGuids: {
      type: Array,
    },
  },
  methods: {
    onQuery() {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          axios
            .get(
              `/darpan/SearchPlaces(query='${this.query}',at='${position.coords.latitude},${position.coords.longitude}')`
            )
            .then((res) => {
              this.queryResult = res.data.value;
            })
            .catch((err) => {
              console.log(err);
              this.$toasted("Error occured");
            });
        },
        () => {
          axios
            .get(`/darpan/SearchPlaces(query='${this.query}',at='')`)
            .then((res) => {
              this.queryResult = res.data.value;
            })
            .catch((err) => {
              console.log(err);
              this.$toasted("Error occured");
            });
        }
      );
    },
    onLocationSelected() {
      debugger;
      if (this.selectedLocation === "") return;
      const loc = this.queryResult[this.selectedLocation];
      const axiosPatchPromises = [];

      for (const guid of this.selectedPhotoGuids) {
        axiosPatchPromises.push(
          axios.patch(
            `/darpan/Files/${guid}`,
            {
              gps_latitudeRef: loc.latRef,
              gps_latitude: loc.lat.toString(),
              gps_longitudeRef: loc.longRef,
              gps_longitude: loc.lon.toString(),
            },
            {
              headers: {
                "content-type": "application/json;IEEE754Compatible=true",
              },
            }
          )
        );
      }

      if (axiosPatchPromises.length == 0) return;

      Promise.all(axiosPatchPromises)
        .then((responses) => {
          const hashes = [];
          for (const res of responses) {
            hashes.push(res.data.hash);
          }
          this.$toasted.success(`${hashes.length} photos updated`);
          this.dialog = false;
        })
        .catch((err) => {
          console.log(err);
          this.$toasted.error("Error Occured");
        });
    },
  },
};
</script>

<style scoped>
.container {
  height: 100%;
  overflow-y: scroll;
}
</style>