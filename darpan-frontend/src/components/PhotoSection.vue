<template>
  <v-col ref="section-tot">
    <v-row justify="start">
      <v-checkbox
        class="ma-0"
        v-model="selectAllCheckbox"
        @change="onSelectAllCheckboxChange"
      ></v-checkbox>
      <slot name="header"></slot>
    </v-row>
    <v-divider class="mb-3" />
    <v-row dense justify="start" ref="section-row" class="ma-0">
      <v-col
        v-for="(photo, index) in photos"
        :key="photo.hash"
        cols="auto"
        class="ma-0 pa-0"
      >
        <v-container
          :style="{
            position: 'relative',
            padding: padding + 'px',
            margin: '0px',
          }"
        >
          <v-tooltip
            bottom
            v-if="
              photo.status_reIndex_code == 2 || photo.status_reIndex_code == 3
            "
          >
            <template v-slot:activator="{ on, attrs }">
              <v-icon
                v-on="on"
                v-bind="attrs"
                :color="photo.status_reIndex_code == 2 ? 'warning' : 'error'"
                class="icon-Photo"
                >mdi-alert-circle-outline</v-icon
              >
            </template>
            <span>{{ photo.status_reIndex.desc }}</span>
          </v-tooltip>

          <v-checkbox
            v-model="photo.selected"
            light
            class="checkBox-Photo"
            @change="onSelectionChange"
          ></v-checkbox>
          <v-img
            v-if="photo.mimeType.startsWith('image')"
            contain
            :src="'/thumb/' + photo.UIpaths_srcSD"
            :width="photoDims[index].width"
            :height="photoDims[index].height"
            :style="{
              opacity: photo.selected ? 0.5 : 1,
            }"
            @click="$emit('photoClicked', index)"
          >
          </v-img>
          <video
            v-else-if="photo.mimeType.startsWith('video')"
            :width="photoDims[index].width"
            :height="photoDims[index].height"
            autoplay
            loop
            :style="{
              opacity: photo.selected ? 0.5 : 1,
            }"
            @click="$emit('photoClicked', index)"
          >
            <source :src="'/thumb/' + photo.UIpaths_srcSD" type="video/mp4" />
          </video>
        </v-container>
      </v-col>
    </v-row>
  </v-col>
</template>

<script>
const mobile = require("is-mobile");

export default {
  name: `PhotoSection`,
  data() {
    return {
      photos: [],
      photoDims: [],
      selectAllCheckbox: false,
      padding: 4,
    };
  },
  props: {
    files: {
      type: Array,
    },
  },
  created() {
    window.addEventListener("resize", this.onResize);
  },
  destroyed() {
    window.removeEventListener("resize", this.onResize);
  },
  watch: {
    files: function () {
      this.photoDims = this.addSizeInfo(this.files);
      this.photos = this.files;
    },
  },
  mounted() {
    this.photoDims = this.addSizeInfo(this.files);
    this.photos = this.files;
  },
  updated() {
    this.$emit("heightCalculated", this.$refs["section-tot"].clientHeight);
  },
  methods: {
    onSelectionChange() {
      if (
        this.photos.filter((_photo) => _photo.selected).length ===
        this.photos.length
      ) {
        this.selectAllCheckbox = true;
      } else {
        this.selectAllCheckbox = false;
      }

      this.$emit("selectionChanged");
    },
    onSelectAllCheckboxChange(value) {
      for (const _photo of this.photos) {
        _photo.selected = value;
      }
      this.$emit("selectionChanged");
    },

    addSizeInfo(_imagesMetadata) {
      const _photoDims = [];
      const width = this.$refs["section-row"].clientWidth;
      const idealHeight = mobile() ? width * 0.3 : width * 0.2;
      const heightVariation = 0.2;
      const padding = this.padding;

      const minHeight = idealHeight - idealHeight * heightVariation;

      const aspectArr = _imagesMetadata.map(
        (_image) =>
          (_image.dimensions_width_orient / _image.dimensions_height_orient) *
          idealHeight
      );

      let w = 0;
      let pad = 0;
      const breakIndex = [];

      for (let i = 0; i < aspectArr.length; i++) {
        w += aspectArr[i];
        pad += 2 * padding;
        if (w + pad > width) {
          if ((width - pad) / (w / idealHeight) >= minHeight) {
            breakIndex.push({
              breakAt: i,
              height: (width - pad) / (w / idealHeight),
            });
            w = 0;
            pad = 0;
          } else {
            breakIndex.push({
              breakAt: i - 1,
              height:
                (width - (pad - 2 * padding)) /
                ((w - aspectArr[i]) / idealHeight),
            });
            w = aspectArr[i];
            pad = 2 * padding;
          }
        } else if (w + pad == width) {
          breakIndex.push({
            breakAt: i,
            height: idealHeight,
          });
          w = 0;
          pad = 0;
        } else if (i == aspectArr.length - 1) {
          breakIndex.push({
            breakAt: i,
            height: idealHeight,
          });
        }
      }

      for (let i = 0; i < breakIndex.length; i++) {
        const element = breakIndex[i];
        for (
          let j = i == 0 ? 0 : breakIndex[i - 1].breakAt + 1;
          j <= element.breakAt;
          j++
        ) {
          _photoDims.push({
            height: element.height,
            width: (aspectArr[j] / idealHeight) * element.height,
          });
        }
      }
      return _photoDims;
    },

    onResize() {
      this.photoDims = this.addSizeInfo(this.photos);
    },
  },
};
</script>

<style scoped>
.checkBox-Photo {
  position: absolute;
  top: 0px;
  left: 0px;
  margin: 0px;
  padding: 0px;
  z-index: 1;
}
.icon-Photo {
  position: absolute;
  top: 0px;
  right: 0px;
  margin: 4px;
  padding: 4px;
  z-index: 1;
}
</style>