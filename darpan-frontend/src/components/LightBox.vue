<template>
  <v-overlay>
    <v-col
      :style="{
        height: lightBoxHeight + 'px',
        width: lightBoxWidth + 'px',
        padding: 0,
        margin: 0,
        'overflow-y': 'auto',
        background: 'black',
      }"
    >
      <v-app-bar
        dense
        flat
        style="
          position: absolute;
          left: 0px;
          top: 0px;
          background: transparent;
          z-index: 2;
        "
      >
        <v-spacer></v-spacer>
        <v-btn icon fab @click="$emit('close')" class="mr-1">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-app-bar>
      <v-row align="stretch" class="row-main">
        <v-col
          cols="12"
          sm="12"
          md="8"
          lg="8"
          xl="8"
          :style="{
            padding: 0,
            margin: 0,
            position: 'relative',
            height: lightBoxHeight + 'px',
          }"
          v-touch="{
            right: () => this.$emit('swipeLeft'),
            left: () => this.$emit('swipeRight'),
          }"
        >
          <div
            :style="{
              position: 'absolute',
              left: '0px',
              top: lightBoxHeight / 2 + 'px',
              'z-index': 2,
            }"
          >
            <v-btn icon fab large @click="$emit('swipeLeft')">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
          </div>

          <v-img
            v-if="photo.mimeType.startsWith('image')"
            :src="'/thumb/' + photo.UIpaths_srcFHD"
            :lazy-src="'/thumb/' + photo.UIpaths_srcSD"
            contain
            :height="lightBoxHeight"
          ></v-img>
          <video
            v-else-if="photo.mimeType.startsWith('video')"
            height="100%"
            width="100%"
            autoplay
            controls
          >
            <source :src="'/original/' + photo.UIpaths_srcOriginal" />
            <source :src="'/thumb/' + photo.UIpaths_srcFHD" type="video/mp4" />
          </video>

          <div
            :style="{
              position: 'absolute',
              right: '0px',
              top: lightBoxHeight / 2 + 'px',
              'z-index': 2,
            }"
          >
            <v-btn icon fab large @click="$emit('swipeRight')">
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
          </div>
        </v-col>
        <v-col
          cols="12"
          sm="12"
          md="4"
          lg="4"
          xl="4"
          :style="{
            margin: 0,
            height: lightBoxHeight + 'px',
            'overflow-y': 'auto',
          }"
        >
          <v-form class="mt-4">
            <v-col>
              <h3 class="font-weight-light">Properties</h3>
              <v-text-field label="Description" class="mt-4" />
              <v-row align="center" class="mt-4">
                <date-time-picker
                  :dateTime="photo.takenDateTime"
                  :disabled="dateTimeDisabled"
                  @input="(i) => (photo.takenDateTime = i)"
                ></date-time-picker>
                <v-btn
                  v-show="dateTimeDisabled"
                  icon
                  small
                  @click="dateTimeDisabled = false"
                >
                  <v-icon>mdi-pencil-outline</v-icon>
                </v-btn>
                <v-btn
                  v-show="!dateTimeDisabled"
                  icon
                  small
                  @click="dateTimeDisabled = true"
                >
                  <v-icon>mdi-pencil-off-outline</v-icon>
                </v-btn>
                <v-btn
                  v-show="!dateTimeDisabled"
                  icon
                  small
                  @click="onDateTimeUpdate"
                >
                  <v-icon>mdi-check</v-icon>
                </v-btn>
              </v-row>
              <v-card class="mt-4" v-if="photo.address_city">
                <v-img :src="'/map/' + photo.UIpaths_srcMap"></v-img>
                <v-card-text>{{ photo.address_label }}</v-card-text>
              </v-card>
            </v-col>
          </v-form>
        </v-col>
      </v-row>
    </v-col>
  </v-overlay>
</template>

<script>
import DateTimePicker from "./DateTimepPicker.vue";
const axios = require("axios");

export default {
  name: "Lightbox",
  data() {
    return {
      lightBoxWidth: 0,
      lightBoxHeight: 0,
      dateTimeDisabled: true,
    };
  },
  props: {
    photo: {
      type: Object,
    },
  },
  watch: {
    photo: function () {
      this.dateTimeDisabled = true;
    },
  },
  components: {
    DateTimePicker,
  },
  created() {
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  },
  destroyed() {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    handleResize() {
      this.lightBoxHeight = window.innerHeight;
      this.lightBoxWidth = window.innerWidth;
    },
    onDateTimeUpdate() {
      axios
        .patch(`/darpan/Files/${this.photo.hash}`, {
          takenDateTime: this.photo.takenDateTime,
        })
        .then((res) => {
          if (res.status == 200) {
            this.$toasted.success("Date Time updated");
            this.dateTimeDisabled = true;
          }
        })
        .catch((err) => {
          console.log(err);
          this.$toasted.error("Error occured");
        });
    },
  },
};
</script>

<style scoped>
.row-main {
  width: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
}
</style>