<template>
  <v-dialog
    v-model="dialog"
    :width="isMobile ? '100%' : '30%'"
    hide-overlay
    :fullscreen="isMobile"
    scrollable
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-on="on" v-bind="attrs" color="primary">
        <v-icon>mdi-image-album</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-toolbar dense>
        <v-spacer></v-spacer>
        <v-toolbar-title>Add pictures to albums</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="dialog = false" color="primary">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-container>
        <v-list>
          <v-list-item-group>
            <v-list-item>
              <v-list-item-content>
                <v-dialog width="50%" v-model="newAlbum">
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn color="primary" v-on="on" v-bind="attrs">
                      <v-icon left>mdi-plus</v-icon>
                      Create New Album
                    </v-btn>
                  </template>
                  <new-album
                    @close="newAlbum = false"
                    @created="onAlbumCreated"
                  />
                </v-dialog>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
          <v-list-item-group v-model="selectedAlbums" color="accent" multiple>
            <v-list-item v-for="(album, i) in albums" :key="i">
              <template v-slot:default="{ active }">
                <v-list-item-action>
                  <v-checkbox :input-value="active"></v-checkbox>
                </v-list-item-action>

                <v-list-item-content>
                  <v-list-item-title>{{ album.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{
                    album.description
                  }}</v-list-item-subtitle>
                </v-list-item-content>
              </template>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-container>
      <v-card-actions>
        <v-btn width="100%" color="primary" @click="onAlbumsSelected">
          Select
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import NewAlbum from "./NewAlbum.vue";
import axios from "axios";
const mobile = require("is-mobile");
export default {
  name: "AddtoAlbum",
  data() {
    return {
      dialog: false,
      newAlbum: false,
      isMobile: mobile(),
      albums: [],
      selectedAlbums: [],
    };
  },
  props: {
    selectedPhotoGuids: {
      type: Array,
    },
  },
  components: {
    NewAlbum,
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      axios.get(`/darpan/Albums`).then((res) => {
        this.albums = res.data.value;
      });
    },
    onAlbumsSelected() {
      const axiosGetPromises = [];
      debugger;

      if (this.selectedPhotoGuids.length == 0) {
        return;
      }

      for (const selectedAlbum of this.selectedAlbums) {
        axiosGetPromises.push(
          axios.get(
            `/darpan/Albums/${this.albums[selectedAlbum].ID}?$expand=files`
          )
        );
      }

      Promise.all(axiosGetPromises)
        .then((responses) => {
          const axiosPatchPromises = [];

          for (const res of responses) {
            const albumFiles = res.data.files;
            albumFiles.push(
              ...this.selectedPhotoGuids.map((hash) => {
                return {
                  file_hash: hash,
                };
              })
            );

            axiosPatchPromises.push(
              axios.patch(`/darpan/Albums/${res.data.ID}`, {
                files: albumFiles,
              })
            );
          }

          if (axiosPatchPromises.length !== 0) {
            return Promise.all(axiosPatchPromises);
          }
        })
        .then((res) => {
          this.$toasted.error("Successfully Added");
          this.dialog = false;
        })
        .catch((err) => {
          console.log(err);
          this.$toasted.error("Error occured");
          this.dialog = false;
        });
    },
    onAlbumCreated() {
      this.fetchData();
      this.newAlbum = false;
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