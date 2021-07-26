<template>
  <v-container fluid>
    <v-toolbar v-if="photoSelected.length != 0" dense flat>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="indigo"
            icon
            @click="onDeleteTemporary"
            v-on="on"
            v-bind="attrs"
          >
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </template>
        <span>Delete Permanently</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="indigo"
            icon
            @click="onDeleteTemporary"
            v-on="on"
            v-bind="attrs"
          >
            <v-icon>mdi-delete-restore</v-icon>
          </v-btn>
        </template>
        <span>Restore</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="indigo"
            icon
            @click="onDeleteTemporary"
            v-on="on"
            v-bind="attrs"
          >
            <v-icon>mdi-delete-sweep-outline</v-icon>
          </v-btn>
        </template>
        <span>Delete All</span>
      </v-tooltip>
    </v-toolbar>
    <photo-section
      :files="photos"
      @selectionChange="(sel) => (photoSelected = sel)"
    >
      <template v-slot:header>
        <h3 class="title">
          {{ `Deleted Photos (${photos.length})` }}
        </h3>
      </template>
    </photo-section>
  </v-container>
</template>

<script>
const axios = require("axios");
import photoSection from "../components/PhotoSection.vue";

export default {
  name: "Bin",
  data() {
    return {
      photos: [],
      photoSelected: [],
    };
  },
  created() {
    this.fetchData();
  },
  components: {
    photoSection,
  },
  methods: {
    fetchData() {
      axios
        .get(
          `/darpan/Files?$apply=filter(deleted eq true)&$orderby=takenDate desc`
        )
        .then((res) => {
          this.photos = res.data.value;
        })
        .catch((err) => {
          if (err.response.status == 401) this.$router.push("/");
          else {
            this.$toasted.error(err.response.data);
          }
        });
    },
  },
};
</script>

<style scoped>
.toolbar {
  position: fixed;
  right: 20px;
  z-index: 2;
  background: cyan;
  border-radius: 25px;
}
.container {
  padding: 20px;
  position: relative;
}
</style>