<template>
  <v-col>
    <v-toolbar
      v-if="photosSelected.length != 0"
      dense
      style="position: fixed; right: 20px; z-index: 2; border-radius: 25px"
    >
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-on="on"
            v-bind="attrs"
            @click="onReindex"
            color="primary"
          >
            <v-icon>mdi-reload</v-icon>
          </v-btn>
        </template>
        <span>Re-index</span>
      </v-tooltip>
      <masslocation-edit :selectedPhotoGuids="photosSelected" />
      <mass-date-edit :selectedPhotoGuids="photosSelected" />
    </v-toolbar>
    <v-row v-for="(section, i) in albumPhotos" :key="i">
      <v-col>
        <v-row justify="center" class="mt-5">
          <v-icon large>mdi-map-marker-outline</v-icon>
          <h2 class="display-1">{{ section.city }}</h2>
        </v-row>
        <photo-section
          :files="section.files"
          @photoClicked="
            (j) => {
              lightBoxPhotoIndex.sectionIndex = i;
              lightBoxPhotoIndex.photoIndex = j;
              lightBoxVisible = true;
            }
          "
        >
          <template v-slot:header>
            <h3 class="title">{{ parseDate(section.takenDate) }}</h3>
          </template>
        </photo-section>
      </v-col>
    </v-row>
    <v-expand-transition>
      <lightbox
        v-if="lightBoxVisible"
        :photo="
          albumPhotos[lightBoxPhotoIndex.sectionIndex].files[
            lightBoxPhotoIndex.photoIndex
          ]
        "
        @close="lightBoxVisible = false"
        @swipeLeft="onSwipeLeft"
        @swipeRight="onSwipeRight"
      />
    </v-expand-transition>
  </v-col>
</template>

<script>
import axios from "axios";
import photoSection from "../components/PhotoSection.vue";
import massDateEdit from "../components/MassDateEdit.vue";
import masslocationEdit from "../components/MassLocationEdit.vue";
import Lightbox from "../components/LightBox.vue";
import moment from "moment";
export default {
  name: "Album",
  data() {
    return {
      albumID: this.$route.params.id,
      albumDetails: {},
      albumPhotos: [],
      lightBoxVisible: false,
      lightBoxPhotoIndex: {
        sectionIndex: 0,
        photoIndex: 0,
      },
    };
  },
  components: {
    photoSection,
    masslocationEdit,
    massDateEdit,
    Lightbox,
  },
  computed: {
    photosSelected: function () {
      const _photosSelected = [];
      for (const _section of this.albumPhotos) {
        const _selPhotos = _section.files.filter((_file) => _file.selected);
        _photosSelected.push(..._selPhotos.map((_selPhoto) => _selPhoto.hash));
      }
      return _photosSelected;
    },
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      if (!this.$route.params.id) return;
      axios.get(`/darpan/Albums/${this.albumID}`).then((res) => {
        this.albumDetails = res.data;
      });
      axios
        .get(`/darpan/Albums/${this.albumID}/files?$expand=file`)
        .then((res) => {
          const _photos = res.data.value.map((v) => v.file);

          _photos.sort(
            (a, b) =>
              moment(a.takenDateTime).unix() - moment(b.takenDateTime).unix()
          );

          const _groupByDate = this.groupBy(_photos, "takenDate");

          for (const _g1 in _groupByDate) {
            const _groupByAddress = this.groupBy(
              _groupByDate[_g1],
              "address_city"
            );

            for (const _g2 in _groupByAddress) {
              const _albumPhoto = {};
              _albumPhoto.takenDate = _g1;
              _albumPhoto.city = _g2;
              _albumPhoto.files = _groupByAddress[_g2];
              this.albumPhotos.push(_albumPhoto);
            }
          }
        });
    },
    groupBy(arr, p) {
      return arr.reduce((r, a) => {
        r[a[p]] = [...(r[a[p]] || []), a];
        return r;
      }, {});
    },
    selectionChange() {
      this.photoSelectedCount = 0;
      for (const sec of this.photoSelected) {
        this.photoSelectedCount += sec.length;
      }
    },

    onReindex() {
      if (this.photosSelected.length == 0) return;

      this.overlay = true;
      axios
        .post("/darpan/Reindex", {
          hashes: this.photosSelected,
        })
        .then((res) => {
          this.overlay = false;
          this.$toasted.success("Re-indexed");
        })
        .catch((err) => {
          this.overlay = false;
          console.log(err);
          this.$toasted.error("Error occured");
        });
    },
    onSwipeLeft() {
      if (this.lightBoxPhotoIndex.photoIndex == 0) {
        if (this.lightBoxPhotoIndex.sectionIndex != 0) {
          this.lightBoxPhotoIndex.sectionIndex--;
          this.lightBoxPhotoIndex.photoIndex =
            this.albumPhotos[this.lightBoxPhotoIndex.sectionIndex].files
              .length - 1;
        }
      } else {
        this.lightBoxPhotoIndex.photoIndex--;
      }
    },
    onSwipeRight() {
      if (
        this.lightBoxPhotoIndex.photoIndex ==
        this.albumPhotos[this.lightBoxPhotoIndex.sectionIndex].files.length - 1
      ) {
        if (
          this.lightBoxPhotoIndex.sectionIndex !=
          this.albumPhotos.length - 1
        ) {
          this.lightBoxPhotoIndex.sectionIndex++;
          this.lightBoxPhotoIndex.photoIndex = 0;
        }
      } else {
        this.lightBoxPhotoIndex.photoIndex++;
      }
    },
    parseDate(_date) {
      return moment(_date).format("dddd, MMMM Do, YYYY");
    },
  },
};
</script>