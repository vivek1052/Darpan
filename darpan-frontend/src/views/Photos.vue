<template>
  <v-container fluid>
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

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-on="on"
            v-bind="attrs"
            @click="onDeleteTemporary"
            color="primary"
          >
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </template>
        <span>Delete</span>
      </v-tooltip>
      <add-to-album :selectedPhotoGuids="photosSelected" />
      <masslocation-edit :selectedPhotoGuids="photosSelected" />
      <mass-date-edit :selectedPhotoGuids="photosSelected" />
    </v-toolbar>

    <v-row v-for="(section, i) in sections" :key="i" class="mb-4">
      <v-sheet
        width="100%"
        :height="section.height"
        :data-id="i"
        v-intersect="{
          handler: fetchFiles,
        }"
      >
        <photo-section
          v-if="section.visible"
          :files="section.files"
          @photoClicked="
            (j) => {
              lightBoxPhotoIndex.sectionIndex = i;
              lightBoxPhotoIndex.photoIndex = j;
              lightBoxVisible = true;
            }
          "
          @heightCalculated="(h) => (section.height = h)"
          @selectionChanged="selectionChanged"
        >
          <template v-slot:header>
            <h3 class="title">
              {{ parseDate(section.takenMonth) + ` (${section.files.length})` }}
            </h3>
          </template>
        </photo-section>
      </v-sheet>
    </v-row>
    <v-overlay v-if="overlay">
      <v-progress-linear indeterminate color="cyan"></v-progress-linear>
    </v-overlay>
    <v-expand-transition>
      <lightbox
        v-if="lightBoxVisible"
        :photo="
          sections[lightBoxPhotoIndex.sectionIndex].files[
            lightBoxPhotoIndex.photoIndex
          ]
        "
        @close="lightBoxVisible = false"
        @swipeLeft="onSwipeLeft"
        @swipeRight="onSwipeRight"
      />
    </v-expand-transition>
  </v-container>
</template>

<script>
import photoSection from "../components/PhotoSection.vue";
import massDateEdit from "../components/MassDateEdit.vue";
import masslocationEdit from "../components/MassLocationEdit.vue";
import addToAlbum from "../components/AddToAlbum.vue";
import Lightbox from "../components/LightBox.vue";
import axios from "axios";
import moment from "moment";

export default {
  name: `Photos`,
  data() {
    return {
      top: 5,
      skip: 0,
      sections: [],
      sectionBuffer: [],
      overlay: false,
      lightBoxVisible: false,
      lightBoxPhotoIndex: {
        sectionIndex: 0,
        photoIndex: 0,
      },
      photosSelected: [],
    };
  },
  components: {
    photoSection,
    massDateEdit,
    masslocationEdit,
    Lightbox,
    addToAlbum,
  },
  mounted() {
    axios
      .get(
        "/darpan/Files?$apply=groupby((takenMonth),aggregate($count as count))&$orderby=takenMonth desc"
      )
      .then((res) => {
        for (const sec of res.data.value) {
          sec.height = 1.5 * sec.count * 0.3 * 0.3 * window.innerWidth;
          sec.files = [];
          sec.filesStillRequired = true;
          sec.visible = false;
          this.sections.push(sec);
        }
      })
      .catch((err) => {
        if (err.response.status == 401) this.$router.push("/");
        else {
          this.$toasted.error(err.response.data);
        }
      });
  },
  methods: {
    fetchFiles(entries, observer, isIntersecting) {
      const index = Number(entries[0].target.dataset.id);

      if (isIntersecting) {
        this.plugSection(index);
      } else {
        this.unplugSection(index);
      }
    },

    selectionChanged() {
      const _photosSelected = [];
      for (const _section of this.sections) {
        const _selPhotos = _section.files.filter((_file) => _file.selected);
        _photosSelected.push(..._selPhotos.map((_selPhoto) => _selPhoto.hash));
      }
      this.photosSelected = _photosSelected;
    },

    async unplugSection(index) {
      this.sections[index].visible = false;
      this.sections[index].filesStillRequired = false;
      return;
    },

    async plugSection(index) {
      const sec = this.sections[index];
      sec.filesStillRequired = true;

      await this.timeOut(500);

      if (!sec.filesStillRequired) return;

      if (sec.files && sec.files.length != 0) {
        sec.visible = true;
      } else {
        const m = moment(sec.takenMonth);
        const filter = m.isValid()
          ? `year(takenDateTime) eq ${m
              .year()
              .toString()} and month(takenDateTime) eq ${m.format("MM")}`
          : `takenDateTime eq null`;

        const res = await axios.get(
          `/darpan/Files?$apply=filter(${filter} and status_deleted ne true)&$orderby=takenDateTime desc&$expand=status_reIndex`
        );
        sec.files = res.data.value;
        sec.visible = true;
      }
      return;
    },

    async timeOut(ms) {
      return new Promise((resolve) => {
        window.setTimeout(() => resolve(), ms);
      });
    },

    onDeleteTemporary() {
      const axiosPromises = [];
      for (const guid of this.photosSelected) {
        axiosPromises.push(
          axios.patch(`/darpan/Files/${guid}`, {
            deleted: true,
          })
        );
      }

      if (axiosPromises.length == 0) return;

      Promise.all(axiosPromises)
        .then((responses) => {
          const hashes = [];
          for (const res of responses) {
            hashes.push(res.data.hash);
          }

          this.$toasted.success(`${hashes.length} photos deleted`);
        })
        .catch((err) => {
          console.log(err);
          this.$toasted.error("Error while deleting");
        });
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
            this.sections[this.lightBoxPhotoIndex.sectionIndex].files.length -
            1;
        }
      } else {
        this.lightBoxPhotoIndex.photoIndex--;
      }
    },
    onSwipeRight() {
      if (
        this.lightBoxPhotoIndex.photoIndex ==
        this.sections[this.lightBoxPhotoIndex.sectionIndex].files.length - 1
      ) {
        if (this.lightBoxPhotoIndex.sectionIndex != this.sections.length - 1) {
          this.lightBoxPhotoIndex.sectionIndex++;
          this.lightBoxPhotoIndex.photoIndex = 0;
        }
      } else {
        this.lightBoxPhotoIndex.photoIndex++;
      }
    },
    parseDate(_date) {
      return moment(_date).format("MMMM, YYYY");
    },
  },
};
</script>

<style scoped>
.container {
  padding: 20px;
  position: relative;
}
</style>