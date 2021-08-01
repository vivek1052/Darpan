<template>
  <v-container fluid>
    <v-toolbar
      v-if="selectedAlbums.length != 0"
      dense
      style="position: fixed; right: 20px; z-index: 2; border-radius: 25px"
    >
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-on="on"
            v-bind="attrs"
            @click="onDelete"
            color="primary"
          >
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </template>
        <span>Delete</span>
      </v-tooltip>
    </v-toolbar>
    <v-row>
      <v-col
        v-for="album in albums"
        :key="album.ID"
        lg="3"
        xl="3"
        md="4"
        sm="6"
        cols="6"
        class="col"
      >
        <v-card>
          <v-checkbox
            v-model="selectedAlbums"
            :value="album.ID"
            light
            class="checkbox"
          ></v-checkbox>
          <v-img
            v-if="album.albumSrc != ''"
            height="200px"
            :src="'/thumb/' + album.albumSrc"
            gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
            @click="$router.push(`/Album/${album.ID}`)"
          >
          </v-img>
          <v-sheet
            v-else
            height="200px"
            color="grey"
            @click="$router.push(`/Album/${album.ID}`)"
          >
          </v-sheet>

          <v-card-title class="text-truncate">{{ album.name }}</v-card-title>
          <v-card-subtitle
            class="text-truncate"
            v-if="album.description != ''"
            >{{ album.description }}</v-card-subtitle
          >
          <v-card-subtitle class="text-truncate" v-else
            >No description</v-card-subtitle
          >
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="newAlbum">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          style="z-index: 5"
          absolute
          bottom
          right
          fab
          color="primary"
          v-on="on"
          v-bind="attrs"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </template>
      <new-album @close="newAlbum = false" @created="onAlbumCreated" />
    </v-dialog>
  </v-container>
</template>

<script>
import axios from "axios";
import NewAlbum from "../components/NewAlbum.vue";

export default {
  name: "Albums",
  data() {
    return {
      albums: [],
      newAlbum: false,
      selectedAlbums: [],
    };
  },
  components: {
    NewAlbum,
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      axios.get("/darpan/Albums").then((res) => {
        this.albums = res.data.value;
      });
    },
    onAlbumCreated() {
      this.fetchData();
      this.newAlbum = false;
    },
    onDelete() {
      const axiosDelPromises = [];
      for (const selectedAlbum of this.selectedAlbums) {
        axiosDelPromises.push(axios.delete(`/darpan/Albums/${selectedAlbum}`));
      }

      if (axiosDelPromises.length == 0) {
        return;
      }

      Promise.all(axiosDelPromises)
        .then((res) => {
          this.$toasted.success("Deleted");
          this.selectedAlbums = [];
          this.fetchData();
        })
        .catch((err) => {
          console.log(err);
          this.$toasted, error("Error occured");
        });
    },
  },
};
</script>

<style scoped>
.col {
  position: relative;
}
.checkbox {
  position: absolute;
  top: 0px;
  left: 0px;
  margin: 0px;
  padding: 0px;
  z-index: 1;
}
</style>